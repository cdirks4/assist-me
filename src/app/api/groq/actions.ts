"use server";

import Groq from "groq-sdk";
import { uniswapService } from "@/services/uniswap";

interface TradeIntent {
  type: 'buy' | 'sell' | 'none';
  tokenIn?: string;
  tokenOut?: string;
  amount?: string;
  slippage?: number;
}

interface AIResponse {
  content: string;
  trade?: TradeIntent;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function parseTradeIntent(message: string): Promise<TradeIntent> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a trade parser. If the user message contains a trade request, return a JSON object with the trade details. Example:
          For "buy 100 USDC worth of ETH": {"type":"buy","tokenIn":"USDC","tokenOut":"ETH","amount":"100"}
          For "sell 0.5 ETH for USDC": {"type":"sell","tokenIn":"ETH","tokenOut":"USDC","amount":"0.5"}
          For other messages: {"type":"none"}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
    });

    const content = completion.choices[0]?.message?.content || "";
    try {
      return JSON.parse(content);
    } catch {
      return { type: "none" };
    }
  } catch (error) {
    return { type: "none" };
  }
}

async function makeRequest(messages: any[], includeMarketData = false): Promise<AIResponse> {
  try {
    if (includeMarketData) {
      const [tokens, recentSwaps] = await Promise.all([
        uniswapService.getTokens(),
        uniswapService.getRecentSwaps(5),
      ]);

      messages.unshift({
        role: "system",
        content: `Current market data:
        Active tokens: ${tokens
          .map((t) => `${t.symbol} (TVL: $${t.totalValueLockedUSD})`)
          .join(", ")}
        Recent swaps: ${recentSwaps
          .map(
            (s) =>
              `${s.pool.token0.symbol}/${s.pool.token1.symbol} - $${s.amountUSD}`
          )
          .join(", ")}`,
      });
    }

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return {
      content: completion.choices[0]?.message?.content || "",
    };
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to process request"
    );
  }
}

export async function analyzeTrade(userMessage: string) {
  const tradeIntent = await parseTradeIntent(userMessage);
  const messages = [
    {
      role: "system",
      content: `You are a DeFi trading assistant on Mantle Network. ${
        tradeIntent.type !== 'none' 
          ? 'I will execute the trade after your analysis.' 
          : 'Analyze trading opportunities based on the provided market data.'
      }`,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await makeRequest(messages, true);
  return {
    ...response,
    trade: tradeIntent.type !== 'none' ? tradeIntent : undefined
  };
}

export async function getMarketUpdate() {
  const messages = [
    {
      role: "system",
      content:
        "Analyze and summarize the current Mantle Network DeFi market conditions based on the provided data.",
    },
    {
      role: "user",
      content:
        "Provide a market update focusing on active pairs, liquidity, and recent trading activity.",
    },
  ];

  return await makeRequest(messages, true);
}
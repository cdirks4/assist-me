"use server";

import Groq from "groq-sdk";
import { uniswapService } from "@/services/uniswap";

interface TradeIntent {
  type: "buy" | "sell" | "wrap" | "unwrap" | "none";
  tokenIn?: string;
  tokenOut?: string;
  amount?: string;
  slippage?: number;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function makeRequest(messages: any[], includeMarketData = false) {
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

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to process request"
    );
  }
}

export async function analyzeTrade(userMessage: string) {
  const messages = [
    {
      role: "system",
      content: `You are a DeFi trading assistant on Mantle Network. Help users understand market conditions and execute trades.`,
    },
    {
      role: "user",
      content: userMessage,
    },
  ];

  const response = await makeRequest(messages, true);
  return {
    content: response,
    trade: await parseTradeIntent(response),
  };
}

export async function getMarketUpdate() {
  const messages = [
    {
      role: "system",
      content:
        "Analyze and summarize the current Mantle Network DeFi market conditions.",
    },
    {
      role: "user",
      content:
        "Provide a market update focusing on active pairs, liquidity, and recent trading activity.",
    },
  ];

  return await makeRequest(messages, true);
}

export async function getTopPools() {
  const pools = await uniswapService.getTokenPairs();
  return pools
    .sort(
      (a, b) =>
        parseFloat(b.totalValueLockedUSD) - parseFloat(a.totalValueLockedUSD)
    )
    .slice(0, 10)
    .map((p) => ({
      pair: `${p.token0.symbol}/${p.token1.symbol}`,
      liquidity: `$${parseFloat(p.totalValueLockedUSD).toLocaleString()}`,
      token0Address: p.token0.id,
      token1Address: p.token1.id,
    }));
}

async function parseTradeIntent(
  message: string
): Promise<TradeIntent> {
  const messages = [
    {
      role: "system",
      content: `Extract trade intent from this message. Return JSON only in this format:
      For wrap: {"type":"wrap","amount":"X"} where X is the amount to wrap
      For unwrap: {"type":"unwrap","amount":"X"} where X is the amount to unwrap
      For buy: {"type":"buy","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X"}
      For sell: {"type":"sell","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X"}
      For wallet balance: {"type":"wallet_balance"}
      For no trade: {"type":"none"}
      
      Examples:
      "wrap 0.1 MNT" -> {"type":"wrap","amount":"0.1"}
      "unwrap 1.5 WMNT" -> {"type":"unwrap","amount":"1.5"}
      "I want to wrap 2 MNT" -> {"type":"wrap","amount":"2"}`,
    },
    {
      role: "user",
      content: message,
    },
  ];

  const response = await makeRequest(messages, false);
  try {
    return JSON.parse(response);
  } catch {
    return { type: "none" };
  }
}

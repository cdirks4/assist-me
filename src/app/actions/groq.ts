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
      const [tokens, recentSwaps, pools] = await Promise.all([
        uniswapService.getTokens(),
        uniswapService.getRecentSwaps(5),
        uniswapService.getTopPools(5)
      ]);

      const totalTVL = pools.reduce((sum, pool) => 
        sum + Number(pool.totalValueLockedUSD), 0
      );

      messages.unshift({
        role: "system",
        content: `Current market context:
        Total TVL: $${totalTVL.toLocaleString()}
        Available tokens: ${tokens.map((t) => `${t.symbol} (TVL: $${t.totalValueLockedUSD})`).join(", ")}
        Top pools: ${pools.map(p => `${p.token0.symbol}/${p.token1.symbol} ($${Number(p.totalValueLockedUSD).toLocaleString()})`).join(", ")}
        Recent swaps: ${recentSwaps.map((s) => `${s.pool.token0.symbol}/${s.pool.token1.symbol} - $${s.amountUSD}`).join(", ")}`,
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
  // Send only the essential system message and user command
  const messages = [
    {
      role: "system",
      content: `You are a DeFi trading assistant on Mantle Network. Process trading commands like:
- Wrap/unwrap MNT/WMNT (e.g., "wrap 0.1 MNT", "unwrap 1 WMNT")
- Token swaps (e.g., "swap 0.5 MNT for USDC", "buy 100 USDC with MNT")

Extract trading intents in JSON format:
- Wrap: {"type":"wrap","amount":"X"}
- Unwrap: {"type":"unwrap","amount":"X"}
- Buy: {"type":"buy","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X","slippage":"0.5"}
- Sell: {"type":"sell","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X","slippage":"0.5"}
- Non-trade: {"type":"none"}`,
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
      content: `Analyze the current Mantle Network DeFi market conditions. Focus on:
      1. Overall market health and TVL trends
      2. Most active trading pairs and their performance
      3. Notable price movements or trading opportunities
      4. Liquidity distribution across pools
      5. Recent significant trades and their impact
      
      Provide a concise but comprehensive analysis that would be useful for traders.`,
    },
    {
      role: "user",
      content: "Provide a detailed market update focusing on active pairs, liquidity, and recent trading activity.",
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
      For buy: {"type":"buy","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X","slippage":"0.5"}
      For sell: {"type":"sell","tokenIn":"TOKEN1","tokenOut":"TOKEN2","amount":"X","slippage":"0.5"}
      For no trade: {"type":"none"}`,
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

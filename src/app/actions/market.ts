"use server";

import Groq from "groq-sdk";
import { uniswapService } from "@/services/uniswap";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeTrade(userMessage: string) {
  try {
    const [tokens, recentSwaps] = await Promise.all([
      uniswapService.getTokens(),
      uniswapService.getRecentSwaps(5),
    ]);

    const messages = [
      {
        role: "system",
        content: `You are a DeFi trading assistant on Mantle Network. Current market data:
        Active tokens: ${tokens.map((t) => `${t.symbol} (TVL: $${t.totalValueLockedUSD})`).join(", ")}
        Recent swaps: ${recentSwaps.map((s) => `${s.pool.token0.symbol}/${s.pool.token1.symbol} - $${s.amountUSD}`).join(", ")}`
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to process request");
  }
}

export async function getMarketUpdate() {
  try {
    const [tokens, recentSwaps] = await Promise.all([
      uniswapService.getTokens(),
      uniswapService.getRecentSwaps(5),
    ]);

    const messages = [
      {
        role: "system",
        content: `Analyze current Mantle Network DeFi market:
        Active tokens: ${tokens.map((t) => `${t.symbol} (TVL: $${t.totalValueLockedUSD})`).join(", ")}
        Recent swaps: ${recentSwaps.map((s) => `${s.pool.token0.symbol}/${s.pool.token1.symbol} - $${s.amountUSD}`).join(", ")}`
      },
      {
        role: "user",
        content: "Provide a market update focusing on active pairs, liquidity, and recent trading activity.",
      },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to process request");
  }
}

export async function getTopPools() {
  try {
    const pools = await uniswapService.getTokenPairs();
    return pools
      .sort((a, b) => parseFloat(b.totalValueLockedUSD) - parseFloat(a.totalValueLockedUSD))
      .slice(0, 10)
      .map((p) => ({
        pair: `${p.token0.symbol}/${p.token1.symbol}`,
        liquidity: `$${parseFloat(p.totalValueLockedUSD).toLocaleString()}`,
        token0Address: p.token0.id,
        token1Address: p.token1.id,
      }));
  } catch (error) {
    console.error("Failed to fetch top pools:", error);
    return [];
  }
}
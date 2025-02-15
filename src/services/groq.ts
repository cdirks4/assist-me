"use server";
import Groq from "groq-sdk";
import { uniswapService } from "./uniswap";

export class GroqService {
  private static groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  private static async makeRequest(messages: any[], includeMarketData = false) {
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

      const completion = await this.groq.chat.completions.create({
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

  static async analyzeTrade(userMessage: string) {
    const messages = [
      {
        role: "system",
        content: `You are a DeFi trading assistant on Mantle Network. Analyze trading opportunities based on the provided market data.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    return await this.makeRequest(messages, true);
  }

  static async getMarketUpdate() {
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

    return await this.makeRequest(messages, true);
  }
}

import { uniswapService } from "./uniswap";

export class HumanQueryService {
  static async executeHumanQuery(userMessage: string): Promise<string> {
    const normalizedMessage = userMessage.toLowerCase();

    try {
      // Handle top movers/pools query
      if (normalizedMessage.includes("top") && (normalizedMessage.includes("mover") || normalizedMessage.includes("pool"))) {
        const pools = await uniswapService.getTopPools(5);
        return `Here are the top pools by TVL:\n${pools
          .map(
            (pool, index) =>
              `${index + 1}. ${pool.token0.symbol}/${pool.token1.symbol} - $${Number(
                pool.totalValueLockedUSD
              ).toLocaleString()}`
          )
          .join("\n")}`;
      }

      // Handle recent trades/swaps query
      if (normalizedMessage.includes("recent") && (normalizedMessage.includes("trade") || normalizedMessage.includes("swap"))) {
        const swaps = await uniswapService.getRecentSwaps(5);
        return `Recent swaps:\n${swaps
          .map(
            (swap) =>
              `• ${swap.pool.token0.symbol}/${swap.pool.token1.symbol} - $${Number(
                swap.amountUSD
              ).toLocaleString()}`
          )
          .join("\n")}`;
      }

      // Handle token list query
      if (normalizedMessage.includes("token") && normalizedMessage.includes("list")) {
        const tokens = await uniswapService.getTokens();
        return `Available tokens:\n${tokens
          .map(
            (token) =>
              `• ${token.symbol} - TVL: $${Number(token.totalValueLockedUSD).toLocaleString()}`
          )
          .join("\n")}`;
      }

      return "I can help you with information about top pools, recent trades, or token listings. Try asking about those!";
    } catch (error) {
      console.error("Error executing human query:", error);
      return "Sorry, I couldn't fetch that information right now. Please try again later.";
    }
  }
}

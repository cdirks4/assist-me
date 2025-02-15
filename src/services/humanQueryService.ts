import { uniswapService } from "./uniswap";

export class HumanQueryService {
  static async executeHumanQuery(userMessage: string): Promise<string> {
    const normalizedMessage = userMessage.toLowerCase();

    try {
      // Handle top pools query with more flexible matching
      if ((normalizedMessage.includes("top") && normalizedMessage.includes("pool")) || 
          normalizedMessage === "what are the top pools" ||
          normalizedMessage === "show top pools" ||
          normalizedMessage === "list top pools") {
        const pools = await uniswapService.getTopPools(5);
        return `Here are the top liquidity pools by Total Value Locked (TVL):\n\n${pools
          .map(
            (pool, index) =>
              `${index + 1}. ${pool.token0.symbol}/${pool.token1.symbol}\n` +
              `   TVL: $${Number(pool.totalValueLockedUSD).toLocaleString()}\n` +
              `   Fee Tier: ${pool.feeTier ? (Number(pool.feeTier) / 10000).toString() + '%' : 'N/A'}`
          )
          .join("\n\n")}\n\nYou can trade any of these pairs using commands like "swap X TOKEN1 for TOKEN2".`;
      }

      // Handle recent trades/swaps query
      if (normalizedMessage.includes("recent") && (normalizedMessage.includes("trade") || normalizedMessage.includes("swap"))) {
        const swaps = await uniswapService.getRecentSwaps(5);
        return `Here are the most recent swaps:\n\n${swaps
          .map(
            (swap, index) =>
              `${index + 1}. ${swap.pool.token0.symbol}/${swap.pool.token1.symbol}\n` +
              `   Amount: $${Number(swap.amountUSD).toLocaleString()}\n` +
              `   Time: ${new Date(Number(swap.timestamp) * 1000).toLocaleString()}`
          )
          .join("\n\n")}`;
      }

      // Handle token list query
      if (normalizedMessage.includes("token") && normalizedMessage.includes("list")) {
        const tokens = await uniswapService.getTokens();
        return `Available tokens on the platform:\n\n${tokens
          .map(
            (token, index) =>
              `${index + 1}. ${token.symbol}\n` +
              `   TVL: $${Number(token.totalValueLockedUSD).toLocaleString()}\n` +
              `   24h Volume: $${Number(token.volumeUSD).toLocaleString()}`
          )
          .join("\n\n")}`;
      }

      return "I can help you with information about:\n" +
             "• Top pools (try 'what are the top pools')\n" +
             "• Recent trades (try 'show recent trades')\n" +
             "• Token listings (try 'show token list')\n" +
             "What would you like to know?";
    } catch (error) {
      console.error("Error executing human query:", error);
      return "Sorry, I couldn't fetch that information right now. Please try again later.";
    }
  }
}

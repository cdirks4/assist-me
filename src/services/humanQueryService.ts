import { uniswapService } from "./uniswap";
import { inMemoryCache } from "@/lib/inMemoryCache";

export class HumanQueryService {
  private static readonly CACHE_KEY = "query_cache";
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async executeHumanQuery(userMessage: string): Promise<string> {
    const normalizedMessage = userMessage.toLowerCase().trim();

    try {
      // Check cache for similar queries
      const cached = inMemoryCache.get<string>(
        `${this.CACHE_KEY}:${normalizedMessage}`
      );
      if (cached) return cached;

      // Pool-related queries
      if (this.isPoolQuery(normalizedMessage)) {
        const response = await this.getPoolInformation();
        inMemoryCache.set(
          `${this.CACHE_KEY}:${normalizedMessage}`,
          response,
          this.CACHE_TTL
        );
        return response;
      }

      // Trading activity queries
      if (this.isTradeActivityQuery(normalizedMessage)) {
        const response = await this.getTradeActivity();
        inMemoryCache.set(
          `${this.CACHE_KEY}:${normalizedMessage}`,
          response,
          this.CACHE_TTL
        );
        return response;
      }

      // Token-specific queries
      if (this.isTokenQuery(normalizedMessage)) {
        const response = await this.getTokenInformation();
        inMemoryCache.set(
          `${this.CACHE_KEY}:${normalizedMessage}`,
          response,
          this.CACHE_TTL
        );
        return response;
      }

      // Volume and liquidity queries
      if (this.isVolumeQuery(normalizedMessage)) {
        const response = await this.getVolumeAndLiquidity();
        inMemoryCache.set(
          `${this.CACHE_KEY}:${normalizedMessage}`,
          response,
          this.CACHE_TTL
        );
        return response;
      }

      // Return help message for unrecognized queries
      return this.getHelpMessage();
    } catch (error) {
      console.error("Error executing human query:", error);
      return "Sorry, I couldn't fetch that information right now. Please try again later.";
    }
  }

  private static isPoolQuery(message: string): boolean {
    const poolKeywords = [
      "pool",
      "pairs",
      "liquidity pool",
      "trading pair",
      "best pool",
      "top pool",
      "active pool",
    ];
    return poolKeywords.some((keyword) => message.includes(keyword));
  }

  private static isTradeActivityQuery(message: string): boolean {
    const tradeKeywords = [
      "trade",
      "swap",
      "transaction",
      "recent",
      "latest",
      "activity",
      "volume",
    ];
    return tradeKeywords.some((keyword) => message.includes(keyword));
  }

  private static isTokenQuery(message: string): boolean {
    const tokenKeywords = [
      "token",
      "coin",
      "available",
      "list",
      "supported",
      "price",
    ];
    return tokenKeywords.some((keyword) => message.includes(keyword));
  }

  private static isVolumeQuery(message: string): boolean {
    const volumeKeywords = [
      "volume",
      "tvl",
      "liquidity",
      "depth",
      "value locked",
      "trading volume",
    ];
    return volumeKeywords.some((keyword) => message.includes(keyword));
  }

  private static async getPoolInformation(): Promise<string> {
    const pools = await uniswapService.getTopPools(5);
    const formattedPools = pools
      .map(
        (pool, index) =>
          `${index + 1}. ${pool.token0.symbol}/${pool.token1.symbol}\n` +
          `   • TVL: $${Number(pool.totalValueLockedUSD).toLocaleString()}\n` +
          `   • Fee Tier: ${
            pool.feeTier
              ? (Number(pool.feeTier) / 10000).toString() + "%"
              : "N/A"
          }\n` +
          `   • Price: 1 ${pool.token0.symbol} = ${Number(
            pool.token1Price
          ).toFixed(6)} ${pool.token1.symbol}`
      )
      .join("\n\n");

    return `Top Liquidity Pools on Mantle:\n\n${formattedPools}\n\nYou can trade in any of these pools using commands like "swap X TOKEN1 for TOKEN2".`;
  }

  private static async getTradeActivity(): Promise<string> {
    const swaps = await uniswapService.getRecentSwaps(5);
    const formattedSwaps = swaps
      .map(
        (swap, index) =>
          `${index + 1}. ${swap.pool.token0.symbol} ↔ ${
            swap.pool.token1.symbol
          }\n` +
          `   • Amount: $${Number(swap.amountUSD).toLocaleString()}\n` +
          `   • Time: ${new Date(
            Number(swap.timestamp) * 1000
          ).toLocaleString()}\n` +
          `   • Pool: ${swap.pool.token0.symbol}/${swap.pool.token1.symbol}`
      )
      .join("\n\n");

    return `Recent Trading Activity:\n\n${formattedSwaps}`;
  }

  private static async getTokenInformation(): Promise<string> {
    const tokens = await uniswapService.getTokens();
    const formattedTokens = tokens
      .map(
        (token, index) =>
          `${index + 1}. ${token.symbol}\n` +
          `   • TVL: $${Number(token.totalValueLockedUSD).toLocaleString()}\n` +
          `   • 24h Volume: $${Number(token.volumeUSD).toLocaleString()}\n` +
          `   • Pools: ${token.poolCount}`
      )
      .join("\n\n");

    return `Available Tokens on Mantle:\n\n${formattedTokens}`;
  }

  private static async getVolumeAndLiquidity(): Promise<string> {
    const [tokens, pools] = await Promise.all([
      uniswapService.getTokens(),
      uniswapService.getTopPools(10),
    ]);

    const totalTVL = pools.reduce(
      (sum, pool) => sum + Number(pool.totalValueLockedUSD),
      0
    );

    const totalVolume = tokens.reduce(
      (sum, token) => sum + Number(token.volumeUSD),
      0
    );

    return (
      `Market Overview:\n\n` +
      `• Total Value Locked: $${totalTVL.toLocaleString()}\n` +
      `• 24h Trading Volume: $${totalVolume.toLocaleString()}\n` +
      `• Active Pools: ${pools.length}\n` +
      `• Available Tokens: ${tokens.length}\n\n` +
      `Top Pool by TVL: ${pools[0].token0.symbol}/${
        pools[0].token1.symbol
      } ($${Number(pools[0].totalValueLockedUSD).toLocaleString()})`
    );
  }

  private static getHelpMessage(): string {
    return (
      "I can help you with information about:\n" +
      "• Liquidity pools (try 'show top pools' or 'what are the best pools?')\n" +
      "• Recent trades (try 'show recent trades' or 'what's the trading activity?')\n" +
      "• Token information (try 'list available tokens' or 'show token prices')\n" +
      "• Market metrics (try 'show trading volume' or 'what's the total TVL?')\n" +
      "• Trading (try 'wrap 1MNT ' or 'uwrap 1 MNT')\n\n" +
      "What would you like to know?"
    );
  }
}

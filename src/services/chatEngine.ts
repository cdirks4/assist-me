import { ethers } from "ethers";
import { analyzeTrade } from "@/app/actions/groq";
import { HumanQueryService } from "./humanQueryService";
import { TradeExecutor } from "./tradeExecutor";
import { uniswapService } from "./uniswap";
import { inMemoryCache } from "@/lib/inMemoryCache";
import { getAgentWalletSummary } from "./agentWalletSummary";
import { filterChatHistory, normalizeUserMessage, isTradeCommand } from "@/lib/chatUtils";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "default" | "trade" | "error" | "info" | "market" | "wallet";
  timestamp: number;
}

interface ProcessedResponse {
  message: string;
  type: ChatMessage["type"];
  action?: {
    type: "trade" | "query" | "wallet" | "none";
    data?: any;
  };
}

export class ChatEngine {
  private static readonly CACHE_KEY = "market_context";
  private static readonly CACHE_TTL = 30000; // 30 seconds

  static async processMessage(
    messages: ChatMessage[],
    newMessage: string
  ): Promise<ProcessedResponse> {
    try {
      // Normalize the input message
      const normalizedMessage = normalizeUserMessage(newMessage);

      // Filter chat history to exclude welcome messages and help text
      const filteredMessages = filterChatHistory(messages);

      // Check for wallet-related queries first
      if (this.isWalletQuery(normalizedMessage)) {
        const walletSummary = await getAgentWalletSummary();
        return {
          message: walletSummary,
          type: "wallet",
          action: { type: "wallet" }
        };
      }

      // Check for market-related queries
      if (this.isMarketQuery(normalizedMessage)) {
        const marketInfo = await this.getMarketContext();
        return {
          message: marketInfo,
          type: "market",
          action: { type: "query" }
        };
      }

      // If it's a trade command, only send the command itself to analyzeTrade
      if (isTradeCommand(normalizedMessage)) {
        const analysis = await analyzeTrade(newMessage);
        
        if (analysis.trade && analysis.trade.type !== "none") {
          const result = await TradeExecutor.executeTradeCommand(newMessage);
          return {
            message: result.message,
            type: result.success ? "trade" : "error",
            action: {
              type: "trade",
              data: result
            }
          };
        }
      }

      // For non-trade queries, use the filtered chat history
      const queryResponse = await HumanQueryService.executeHumanQuery(newMessage);
      return {
        message: queryResponse,
        type: "info",
        action: { type: "query" }
      };

    } catch (error) {
      console.error("Chat processing error:", error);
      return {
        message: `I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please try rephrasing your request.`,
        type: "error",
        action: { type: "none" }
      };
    }
  }

  private static isWalletQuery(message: string): boolean {
    const walletKeywords = [
      "balance",
      "wallet",
      "holdings",
      "portfolio",
      "funds",
      "assets"
    ];
    return walletKeywords.some(keyword => message.includes(keyword));
  }

  private static isMarketQuery(message: string): boolean {
    const marketKeywords = [
      "market",
      "price",
      "trend",
      "volume",
      "liquidity",
      "stats",
      "overview",
      "analysis"
    ];
    return marketKeywords.some(keyword => message.includes(keyword));
  }

  private static async getMarketContext(): Promise<string> {
    try {
      // Check cache first
      const cached = inMemoryCache.get<string>(this.CACHE_KEY);
      if (cached) return cached;

      // Fetch fresh market data
      const [tokens, pools, recentSwaps] = await Promise.all([
        uniswapService.getTokens(),
        uniswapService.getTopPools(5),
        uniswapService.getRecentSwaps(5)
      ]);

      // Calculate total market TVL
      const totalTVL = pools.reduce((sum, pool) => 
        sum + Number(pool.totalValueLockedUSD), 0
      );

      // Format market summary
      const marketSummary = `Current Market Overview:
• Total Value Locked: $${totalTVL.toLocaleString()}
• Most Active Pools:
${pools.map(pool => 
  `  - ${pool.token0.symbol}/${pool.token1.symbol}: $${Number(pool.totalValueLockedUSD).toLocaleString()}`
).join('\n')}

Recent Trading Activity:
${recentSwaps.map(swap => 
  `• ${swap.pool.token0.symbol} → ${swap.pool.token1.symbol}: $${Number(swap.amountUSD).toLocaleString()}`
).join('\n')}

Available Tokens: ${tokens.map(t => t.symbol).join(', ')}`;

      // Cache the result
      inMemoryCache.set(this.CACHE_KEY, marketSummary, this.CACHE_TTL);
      return marketSummary;

    } catch (error) {
      console.error("Error getting market context:", error);
      return "Unable to fetch current market data. Please try again later.";
    }
  }
}

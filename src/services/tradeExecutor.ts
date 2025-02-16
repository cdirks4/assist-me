import { WalletService } from "./wallet";
import { agentKit } from "./agentkit";
import { analyzeTrade } from "@/app/actions/groq";
import { HumanQueryService } from "./humanQueryService";
import { getAgentWalletSummary } from "./agentWalletSummary";
import { TradeResult, TradeIntent } from "@/types/chat";
import { SmartRouterService } from "./smartRouter";
import { uniswapService } from "./uniswap";

export class TradeExecutor {
  static async executeTradeCommand(userMessage: string): Promise<TradeResult> {
    try {
      // First analyze the trade intent using AI
      const analysis = await analyzeTrade(userMessage);
      const tradeIntent = analysis.trade;

      // Handle wallet balance queries
      if (this.isWalletQuery(userMessage)) {
        const walletSummary = await getAgentWalletSummary();
        return {
          success: true,
          message: walletSummary,
          metadata: {
            tokenIn: "WALLET_QUERY"
          }
        };
      }

      // Handle non-trade queries
      if (!tradeIntent || tradeIntent.type === "none") {
        const response = await HumanQueryService.executeHumanQuery(userMessage);
        return {
          success: true,
          message: response,
          metadata: {
            tokenIn: "INFO_QUERY"
          }
        };
      }

      // Get signer for transactions
      const signer = agentKit.getSigner();
      if (!signer) {
        throw new Error("Wallet not connected");
      }

      // Handle different trade types
      switch (tradeIntent.type) {
        case "wrap": {
          if (!tradeIntent.amount) {
            throw new Error("Amount not specified for wrap operation");
          }
          const hash = await WalletService.wrapMNT(tradeIntent.amount, signer);
          return {
            success: true,
            message: `Successfully wrapped ${tradeIntent.amount} MNT to WMNT!`,
            hash,
            metadata: {
              tokenIn: "MNT",
              tokenOut: "WMNT",
              amount: tradeIntent.amount
            }
          };
        }

        case "unwrap": {
          if (!tradeIntent.amount) {
            throw new Error("Amount not specified for unwrap operation");
          }
          const hash = await WalletService.unwrapWMNT(tradeIntent.amount, signer);
          return {
            success: true,
            message: `Successfully unwrapped ${tradeIntent.amount} WMNT to MNT!`,
            hash,
            metadata: {
              tokenIn: "WMNT",
              tokenOut: "MNT",
              amount: tradeIntent.amount
            }
          };
        }

        case "buy":
        case "sell": {
          if (!tradeIntent.tokenIn || !tradeIntent.tokenOut || !tradeIntent.amount) {
            throw new Error("Incomplete trade parameters");
          }

          // Verify pool exists
          const pool = await uniswapService.findPoolByTokens(
            tradeIntent.tokenIn,
            tradeIntent.tokenOut
          );
          if (!pool) {
            throw new Error(
              `No liquidity pool available for ${tradeIntent.tokenIn}/${tradeIntent.tokenOut}`
            );
          }

          // Execute the swap
          const hash = await SmartRouterService.executeSwap({
            tokenIn: tradeIntent.tokenIn,
            tokenOut: tradeIntent.tokenOut,
            amount: tradeIntent.amount,
            slippageTolerance: tradeIntent.slippage || 0.5
          });

          return {
            success: true,
            message: `Successfully swapped ${tradeIntent.amount} ${tradeIntent.tokenIn} for ${tradeIntent.tokenOut}!`,
            hash,
            metadata: {
              tokenIn: tradeIntent.tokenIn,
              tokenOut: tradeIntent.tokenOut,
              amount: tradeIntent.amount,
              price: pool.token1Price // Add price information from the pool
            }
          };
        }

        default:
          throw new Error("Unsupported trade type");
      }
    } catch (error) {
      console.error("Trade execution failed:", error);
      return {
        success: false,
        message: `Trade failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        metadata: {
          tokenIn: "ERROR"
        }
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
    return walletKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  private static async validateTradeParameters(
    tradeIntent: TradeIntent
  ): Promise<string | null> {
    if (!tradeIntent.amount) {
      return "Amount not specified";
    }

    if (tradeIntent.type === "buy" || tradeIntent.type === "sell") {
      if (!tradeIntent.tokenIn || !tradeIntent.tokenOut) {
        return "Token pair not specified";
      }

      // Check if tokens exist
      const tokens = await uniswapService.getTokens();
      const tokenInExists = tokens.some(
        t => t.symbol.toLowerCase() === tradeIntent.tokenIn?.toLowerCase()
      );
      const tokenOutExists = tokens.some(
        t => t.symbol.toLowerCase() === tradeIntent.tokenOut?.toLowerCase()
      );

      if (!tokenInExists || !tokenOutExists) {
        return "One or both tokens not found";
      }
    }

    return null;
  }
}

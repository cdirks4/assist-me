import { WalletService } from "./wallet";
import { agentKit } from "./agentkit";
import { analyzeTrade } from "@/app/actions/groq";
import { HumanQueryService } from "./humanQueryService";

interface TradeResult {
  success: boolean;
  message: string;
  hash?: string;
}

export class TradeExecutor {
  static async executeTradeCommand(userMessage: string): Promise<TradeResult> {
    try {
      // First analyze the trade intent using AI
      const analysis = await analyzeTrade(userMessage);
      const tradeIntent = analysis.trade;

      if (!tradeIntent) {
        return {
          success: false,
          message: "Could not understand trade intent. Try 'wrap X MNT' or 'unwrap X WMNT'",
        };
      }

      // Handle non-trade queries
      if (tradeIntent.type === "none") {
        const response = await HumanQueryService.executeHumanQuery(userMessage);
        return {
          success: true,
          message: response,
        };
      }

      if (tradeIntent.type === "wrap" && tradeIntent.amount) {
        const signer = agentKit.getSigner();
        const hash = await WalletService.wrapMNT(tradeIntent.amount, signer);
        return {
          success: true,
          message: `Successfully wrapped ${tradeIntent.amount} MNT to WMNT!`,
          hash,
        };
      }

      if (tradeIntent.type === "unwrap" && tradeIntent.amount) {
        const signer = agentKit.getSigner();
        const hash = await WalletService.unwrapWMNT(tradeIntent.amount, signer);
        return {
          success: true,
          message: `Successfully unwrapped ${tradeIntent.amount} WMNT to MNT!`,
          hash,
        };
      }

      return {
        success: false,
        message: "Unsupported trade command. Try 'wrap X MNT' or 'unwrap X WMNT', or ask about market information",
      };
    } catch (error) {
      console.error("Trade execution failed:", error);
      return {
        success: false,
        message: `Trade failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

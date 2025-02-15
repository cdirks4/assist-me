import { DEBUG_CONFIG } from "@/config/debug";

interface MockTradeParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
}

export class MockTradeService {
  static async executeMockTrade({
    tokenIn,
    tokenOut,
    amount,
    slippageTolerance = 0.5,
  }: MockTradeParams): Promise<string> {
    // Log that we're executing a mock trade
    console.log("Executing mock trade with params:", {
      tokenIn,
      tokenOut,
      amount,
      slippageTolerance,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate a mock transaction hash
    const mockTxHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    if (DEBUG_CONFIG.SHOW_DETAILED_ERRORS) {
      console.log("Mock trade executed successfully:", {
        hash: mockTxHash,
        tokenIn,
        tokenOut,
        amount,
      });
    }

    return mockTxHash;
  }
}

export const mockTradeService = new MockTradeService();

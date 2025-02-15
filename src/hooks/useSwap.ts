import { useState } from "react";
import { swapService } from "@/services/swapService";

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  recipient: string;
  slippageTolerance?: number;
}

interface SwapError {
  message: string;
  details?: {
    code?: string;
    data?: any;
    transaction?: any;
    reason?: string;
    balance?: string;
    allowance?: string;
  };
}

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SwapError | null>(null);

  const executeSwap = async ({
    tokenIn,
    tokenOut,
    amount,
    recipient,
    slippageTolerance,
  }: SwapParams) => {
    setLoading(true);
    setError(null);

    try {
      // First approve the token if it's not native MNT
      if (tokenIn.toLowerCase() !== "mnt") {
        try {
          await swapService.approveToken(tokenIn, amount);
        } catch (approvalError: any) {
          console.error("Token approval failed:", approvalError);
          setError({
            message: "Failed to approve token spending",
            details: {
              code: approvalError.code,
              data: approvalError.data,
              reason: approvalError.reason,
              transaction: approvalError.transaction,
            },
          });
          throw approvalError;
        }
      }

      // Execute the swap
      const result = await swapService.executeSwap({
        tokenIn,
        tokenOut,
        amount,
        recipient,
        slippageTolerance,
      });

      return result;
    } catch (err: any) {
      console.error("Swap execution failed:", err);
      
      // Create detailed error object
      const swapError: SwapError = {
        message: err.message || "Swap failed",
        details: {
          code: err.code,
          data: err.data,
          transaction: err.transaction,
          reason: err.reason,
        },
      };

      // Add balance and allowance if available in the error
      if (err.balance) swapError.details.balance = err.balance;
      if (err.allowance) swapError.details.allowance = err.allowance;

      setError(swapError);
      throw err; // Preserve original error for upstream handling
    } finally {
      setLoading(false);
    }
  };

  return {
    executeSwap,
    loading,
    error,
  };
}

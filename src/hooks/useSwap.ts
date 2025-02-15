import { useState } from "react";
import { swapService } from "@/services/swapService";

interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  recipient: string;
  slippageTolerance?: number;
}

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        await swapService.approveToken(tokenIn, amount);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Swap failed";
      setError(errorMessage);
      throw new Error(errorMessage);
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
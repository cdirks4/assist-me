import { useState } from "react";
import { swapService } from "@/services/swapService";

export function useSwap() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSwap = async ({
    tokenIn,
    tokenOut,
    amount,
    recipient,
    slippageTolerance,
  }: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    recipient: string;
    slippageTolerance?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
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

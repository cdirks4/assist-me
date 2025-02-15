"use client";

import { useState, useEffect } from "react";
import { useSwap } from "@/hooks/useSwap";
import { uniswapService } from "@/services/uniswap";

export function TestSwapButton({ agentAddress }: { agentAddress: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const { executeSwap } = useSwap();

  useEffect(() => {
    const loadTokens = async () => {
      const availableTokens = await uniswapService.getTokens();
      setTokens(availableTokens);
    };
    loadTokens();
  }, []);

  const handleTestSwap = async () => {
    if (!agentAddress || isLoading || tokens.length < 2) return;
    
    setIsLoading(true);
    try {
      // Use the first two tokens from the available pools
      const tokenIn = tokens[0].id;
      const tokenOut = tokens[1].id;
      
      console.log("Attempting swap with tokens:", {
        tokenIn: `${tokens[0].symbol} (${tokenIn})`,
        tokenOut: `${tokens[1].symbol} (${tokenOut})`
      });

      await executeSwap({
        tokenIn,
        tokenOut,
        amount: "0.1",
        recipient: agentAddress,
        slippageTolerance: 0.5,
      });
      alert("Test swap completed!");
    } catch (error) {
      console.error("Test swap failed:", error);
      alert(`Swap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleTestSwap}
      disabled={isLoading || !agentAddress || tokens.length < 2}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white"
    >
      {isLoading ? "Swapping..." : `Test Swap (${tokens[0]?.symbol || '...'} → ${tokens[1]?.symbol || '...'})`}
    </button>
  );
}
"use client";

import { useState } from "react";
import { SmartRouterService } from "@/services/smartRouter";
import { DEBUG_CONFIG } from "@/config/debug";
import { useAgentWallet } from "@/context/AgentWalletContext";

interface SwapPoolButtonProps {
  token0Address: string;
  token1Address: string;
  token0Symbol: string;
  token1Symbol: string;
}

export function SwapPoolButton({
  token0Address,
  token1Address,
  token0Symbol,
  token1Symbol,
}: SwapPoolButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAgentWallet();

  const handleSwap = async () => {
    if (isLoading || !isConnected) return;
    
    setIsLoading(true);
    try {
      const txHash = await SmartRouterService.executeSwap({
        tokenIn: token0Address,
        tokenOut: token1Address,
        amount: "0.01",
        slippageTolerance: 0.5,
      });
      alert(`Successfully swapped 0.01 ${token0Symbol} for ${token1Symbol}`);
    } catch (error) {
      console.error("Real swap failed:", error);
      try {
        console.log("Attempting mock trade...");
        const mockTxHash = await SmartRouterService.executeMockTrade({
          tokenIn: token0Address,
          tokenOut: token1Address,
          amount: "0.01",
          slippageTolerance: 0.5,
        });
        alert(`Mock trade executed successfully. Transaction hash: ${mockTxHash}`);
      } catch (mockError) {
        console.error("Mock trade failed:", mockError);
        const errorMessage = DEBUG_CONFIG.SHOW_DETAILED_ERRORS
          ? `Mock trade failed: ${mockError instanceof Error ? mockError.message : "Unknown error"}`
          : "Failed to execute trade";
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSwap}
      disabled={isLoading || !isConnected}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm"
    >
      {isLoading ? "Swapping..." : `Swap ${token0Symbol} → ${token1Symbol}`}
    </button>
  );
}

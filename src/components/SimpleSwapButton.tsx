"use client";

import { useState } from "react";
import { SmartRouterService } from "@/services/smartRouter";
import { ApproveTokenButton } from "./ApproveTokenButton";
import { COMMON_BASES } from "@/constants/contracts";
import { DEBUG_CONFIG, formatErrorDetails } from "@/config/debug";
import { useAgentWallet } from "@/context/AgentWalletContext";

export function SimpleSwapButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const { isConnected } = useAgentWallet();

  const handleSwap = async () => {
    if (isLoading || !isConnected) return;
    setIsLoading(true);
    setError(null);
    setDetailedError(null);
    setNeedsApproval(false);

    try {
      const hash = await SmartRouterService.executeSimpleSwap("0.01");
      alert(`Successfully swapped 0.01 WMNT for MUSDT\nTransaction: ${hash}`);
    } catch (error: any) {
      console.error("Simple swap failed:", error);
      
      // Set detailed error information if debug mode is enabled
      if (DEBUG_CONFIG.SHOW_DETAILED_ERRORS) {
        setDetailedError(formatErrorDetails(error));
      }
      
      // Set user-friendly error message
      let userMessage = error.message || "Failed to complete the swap. Please try again or contact support if the issue persists.";
      
      if (error.message?.includes("insufficient balance")) {
        userMessage = "Insufficient MNT balance to complete the swap. Please ensure you have enough MNT plus gas fees.";
      } else if (error.message?.includes("insufficient allowance")) {
        userMessage = "Token approval needed. Please approve token spending below.";
        setNeedsApproval(true);
      } else if (error.message?.includes("insufficient liquidity")) {
        userMessage = "Not enough liquidity in the pool to complete this swap. Try a smaller amount or wait for more liquidity.";
      } else if (error.code === "CALL_EXCEPTION") {
        // The error message should already be enriched from SmartRouterService
        userMessage = error.message;
        
        if (error.message?.includes("insufficient allowance")) {
          setNeedsApproval(true);
        }
        
        if (DEBUG_CONFIG.SHOW_DETAILED_ERRORS) {
          userMessage += "\n\nTechnical details are shown below.";
        }
      }
      
      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleSwap}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm"
      >
        {isLoading ? "Swapping..." : "Swap WMNT → MUSDT"}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm mt-1 max-w-md">
          <p className="text-center mb-2 whitespace-pre-line">{error}</p>
          {detailedError && (
            <pre className="bg-red-950/50 p-3 rounded-lg overflow-x-auto text-xs whitespace-pre-wrap border border-red-900">
              {detailedError}
            </pre>
          )}
        </div>
      )}
      
      {needsApproval && (
        <ApproveTokenButton
          tokenAddress={COMMON_BASES.WMNT}
          amount="0.01"
          onSuccess={() => {
            setNeedsApproval(false);
            setError(null);
            setDetailedError(null);
          }}
        />
      )}
    </div>
  );
}

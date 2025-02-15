"use client";

import { useState } from "react";
import { swapService } from "@/services/swapService";
import { FUSIONX_V3_CONTRACTS } from "@/constants/contracts";
import { useAgentWallet } from "@/context/AgentWalletContext";

interface ApproveTokenButtonProps {
  tokenAddress: string;
  amount: string;
  spender?: string;
  onSuccess?: () => void;
}

export function ApproveTokenButton({ 
  tokenAddress, 
  amount, 
  spender = FUSIONX_V3_CONTRACTS.SMART_ROUTER,
  onSuccess
}: ApproveTokenButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected } = useAgentWallet();

  const handleApprove = async () => {
    if (isLoading || !isConnected) return;
    setIsLoading(true);
    setError(null);

    try {
      await swapService.approveToken(tokenAddress, amount, spender);
      onSuccess?.();
    } catch (err) {
      console.error("Token approval failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to approve token";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm"
      >
        {isLoading ? "Approving..." : "Approve Token Spending"}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-1 max-w-md text-center">
          {error}
        </p>
      )}
    </div>
  );
}

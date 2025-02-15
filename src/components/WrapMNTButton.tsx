"use client";

import { useState } from "react";
import { WalletService } from "@/services/wallet";
import { agentKit } from "@/services/agentkit";

export function WrapMNTButton({ agentAddress }: { agentAddress: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleWrap = async () => {
    if (!agentAddress || isLoading) return;
    
    setIsLoading(true);
    try {
      const signer = agentKit.getSigner();
      await WalletService.wrapMNT("0.1", signer);
      alert("Successfully wrapped 0.1 MNT to WMNT!");
    } catch (error) {
      console.error("Failed to wrap MNT:", error);
      alert(`Wrap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleWrap}
      disabled={isLoading || !agentAddress}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white"
    >
      {isLoading ? "Wrapping..." : "Wrap 0.1 MNT → WMNT"}
    </button>
  );
}
"use client";

import { useState } from "react";
import { WalletService } from "@/services/wallet";
import { agentKit } from "@/services/agentkit";

export function UnwrapButton({ agentAddress }: { agentAddress: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnwrap = async () => {
    if (!agentAddress || isLoading) return;
    
    setIsLoading(true);
    try {
      const signer = agentKit.getSigner();
      await WalletService.unwrapWMNT("0.1", signer);
      alert("Successfully unwrapped 0.1 WMNT to MNT!");
    } catch (error) {
      console.error("Failed to unwrap WMNT:", error);
      alert(`Unwrap failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleUnwrap}
      disabled={isLoading || !agentAddress}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white"
    >
      {isLoading ? "Unwrapping..." : "Unwrap 0.1 WMNT → MNT"}
    </button>
  );
}
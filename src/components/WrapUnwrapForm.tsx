"use client";

import { useState } from "react";
import { WalletService } from "@/services/wallet";
import { agentKit } from "@/services/agentkit";

interface WrapUnwrapFormProps {
  onSuccess?: () => void;
}

export function WrapUnwrapForm({ onSuccess }: WrapUnwrapFormProps) {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleWrap = async () => {
    if (!amount || isLoading) return;
    setIsLoading(true);
    try {
      const signer = agentKit.getSigner();
      await WalletService.wrapMNT(amount, signer);
      alert(`Successfully wrapped ${amount} MNT`);
      onSuccess?.();
    } catch (error) {
      console.error("Wrap failed:", error);
      alert(`Failed to wrap: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnwrap = async () => {
    if (!amount || isLoading) return;
    setIsLoading(true);
    try {
      const signer = agentKit.getSigner();
      await WalletService.unwrapWMNT(amount, signer);
      alert(`Successfully unwrapped ${amount} WMNT`);
      onSuccess?.();
    } catch (error) {
      console.error("Unwrap failed:", error);
      alert(`Failed to unwrap: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount"
        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
      />
      <div className="flex gap-4">
        <button
          onClick={handleWrap}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white"
        >
          {isLoading ? "Processing..." : "Wrap MNT"}
        </button>
        <button
          onClick={handleUnwrap}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white"
        >
          {isLoading ? "Processing..." : "Unwrap WMNT"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { COMMON_BASES } from "@/constants/contracts";
import { SwapPoolButton } from "./SwapPoolButton";
import { useAgentWallet } from "@/context/AgentWalletContext";

export function Trading() {
  const { isConnected, error } = useAgentWallet();

  if (error) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <div className="text-gray-500">Connecting to agent wallet...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4">Swap Tokens</h2>
      <div className="space-y-4">
        <SwapPoolButton
          token0Address={COMMON_BASES.WMNT}
          token1Address={COMMON_BASES.DAI}
          token0Symbol="WMNT"
          token1Symbol="DAI"
        />
      </div>
    </div>
  );
}

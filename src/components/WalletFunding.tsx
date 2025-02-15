"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { WalletService } from "@/services/wallet";
import { ethers } from "ethers";
import { agentKit } from "@/services/agentkit";

export function WalletFunding() {
  const { login, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [amount, setAmount] = useState("0.01");
  const [status, setStatus] = useState<"idle" | "funding" | "funded" | "error">("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [agentAddress, setAgentAddress] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const address = agentKit.getWalletAddress();
    if (address) {
      setAgentAddress(address);
    }
  }, []);

  const handleFunding = async () => {
    if (!authenticated || !wallets?.[0]) {
      await login();
      return;
    }

    if (!agentAddress || !ethers.isAddress(agentAddress)) {
      setErrorMessage("Invalid agent address");
      setStatus("error");
      return;
    }

    setStatus("funding");
    setErrorMessage("");
    
    try {
      const provider = new ethers.BrowserProvider(
        await wallets[0].getEthereumProvider()
      );
      const signer = await provider.getSigner();

      // Get balance before transaction
      const balance = await provider.getBalance(await signer.getAddress());
      const amountWei = ethers.parseEther(amount);
      
      if (balance < amountWei) {
        throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} MNT`);
      }

      const hash = await WalletService.fundWallet(
        agentAddress,
        amount,
        signer
      );

      setTxHash(hash);
      setStatus("funded");
    } catch (error) {
      console.error("Funding error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to send transaction");
      setStatus("error");
    }
  };

  return (
    <div className="p-6 bg-white/5 rounded-lg border border-white/10">
      <h2 className="text-xl font-semibold mb-4">Fund Wallet</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Amount (MNT)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-lg"
          />
        </div>

        <button
          onClick={handleFunding}
          disabled={status === "funding"}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {status === "funding" ? "Sending..." : "Send MNT"}
        </button>

        {status === "funded" && (
          <div className="text-green-400">
            Transaction successful! Hash: {txHash.slice(0, 10)}...
          </div>
        )}

        {status === "error" && (
          <div className="text-red-400">
            {errorMessage || "Failed to send transaction. Please try again."}
          </div>
        )}
      </div>
    </div>
  );
}

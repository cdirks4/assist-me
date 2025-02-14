"use client";

import { useEffect, useState } from "react";
import { agentKit } from "@/services/agentkit";

interface WalletManagerProps {
  userId: string;
}

export default function WalletManager({ userId }: WalletManagerProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        const connected = await agentKit.connectWallet(userId, false);
        if (connected) {
          const address = agentKit.getWalletAddress();
          setAddress(address);
          const balance = await agentKit.getBalance();
          setBalance(balance);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize wallet");
      } finally {
        setIsLoading(false);
      }
    };

    initializeWallet();
  }, [userId]);

  if (isLoading) {
    return <div>Loading wallet...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Agent Wallet</h2>
      <div>Address: {address || "Not connected"}</div>
      <div>Balance: {balance} ETH</div>
    </div>
  );
}
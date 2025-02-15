"use client";

import { WalletBalance } from "@/components/WalletBalance";
import { TopPools } from "@/components/TopPools";
import { TradingChat } from "@/components/TradingChat";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { WrapUnwrapForm } from "@/components/WrapUnwrapForm";
import { useAgentWallet } from "@/hooks/useAgentWallet";

export default function MarketPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { refreshBalances } = useAgentWallet();

  const handleWrapUnwrapSuccess = async () => {
    await refreshBalances();
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <TopPools />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">DeFi Market Assistant</h1>

        {wallets?.[0]?.address && (
          <div className="space-y-4 mb-8">
            <WalletBalance address={wallets[0].address} />
            <div className="flex gap-4">
              <WrapUnwrapForm onSuccess={handleWrapUnwrapSuccess} />
            </div>
          </div>
        )}

        <TradingChat />
      </div>
    </div>
  );
}

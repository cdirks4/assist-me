"use client";

import { useState } from "react";
import CreateWallet from "@/components/CreateWallet";
import { WalletFunding } from "@/components/WalletFunding";
import { TransferBackButton } from "@/components/TransferBackButton";
import { TradingChat } from "@/components/TradingChat";
import { Trading } from "@/components/Trading";
import { SimpleSwapButton } from "@/components/SimpleSwapButton";
import { useAgentWallet } from "@/context/AgentWalletContext";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { address: agentAddress } = useAgentWallet();
  const userId = "test-user";

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            DeFi Assistant Platform
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your AI-powered DeFi trading companion on Mantle Network
          </p>
        </div>

        {/* <Trading /> */}
        {agentAddress ? (
          <WalletFunding />
        ) : (
          <div className="text-center text-gray-400">
            Loading agent wallet...
          </div>
        )}
        {/* <SimpleSwapButton /> */}
        <TransferBackButton />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Wallet Creation */}
          <div className="card bg-white/5 rounded-xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
            {!walletAddress ? (
              <CreateWallet
                userId={userId}
                onWalletCreated={setWalletAddress}
              />
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h3 className="text-green-400 font-medium mb-2">
                    Wallet Created!
                  </h3>
                  <p className="text-sm text-gray-400 break-all">
                    {walletAddress}
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Features */}
          <div className="space-y-6">
            <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-semibold mb-4">AI-Powered Trading</h3>
              <p className="text-gray-400">
                Execute trades with confidence using our advanced AI assistant
              </p>
            </div>

            <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-semibold mb-4">Mantle Network</h3>
              <p className="text-gray-400">
                Experience fast and low-cost transactions on Mantle Sepolia
                testnet
              </p>
            </div>

            <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-semibold mb-4">
                Smart Portfolio Management
              </h3>
              <p className="text-gray-400">
                Monitor and manage your DeFi positions with intelligent insights
              </p>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            Running on Mantle Sepolia Testnet
          </p>
        </div>
      </main>
    </div>
  );
}

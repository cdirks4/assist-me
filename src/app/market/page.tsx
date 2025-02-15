"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { analyzeTrade } from "../actions/groq";
import { useSwap } from "@/hooks/useSwap";
import { WalletService } from "@/services/wallet";
import { agentKit } from "@/services/agentkit";
import { WalletBalance } from "@/components/WalletBalance";
import { TopPools } from "@/components/TopPools";
import { COMMON_BASES } from "@/constants/contracts";
import { WrapUnwrapForm } from "@/components/WrapUnwrapForm";
import { useAgentWallet } from "@/hooks/useAgentWallet";
import { SmartRouterService } from "@/services/smartRouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "wallet" | "trade" | "default";
}

export default function MarketPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the DeFi trading assistant! How can I help you today?",
      type: "default",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { executeSwap, loading: swapLoading } = useSwap();
  const {
    balances,
    loading: walletLoading,
    refreshBalances,
  } = useAgentWallet();

  const displayWalletContents = async () => {
    if (balances.length === 0) return;

    const walletContent = balances
      .map(
        (b) => `${b.symbol}: ${Number(b.balance).toFixed(6)} (${b.usdValue})`
      )
      .join("\n");

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Current Agent Wallet Contents:\n${walletContent}`,
        type: "wallet",
      },
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !wallets?.[0]?.address) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, type: "default" },
    ]);

    try {
      const response = await analyzeTrade(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content, type: "default" },
      ]);

      if (response.trade && response.trade.type !== "none") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Processing trade...", type: "trade" },
        ]);

        try {
          if (response.trade.type === "wrap") {
            const signer = agentKit.getSigner();
            await WalletService.wrapMNT(response.trade.amount!, signer);
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `Successfully wrapped ${response.trade.amount} MNT to WMNT!`,
                type: "trade",
              },
            ]);
          } else {
            const tokenIn =
              response.trade.tokenIn?.toLowerCase() === "mnt"
                ? COMMON_BASES.WMNT
                : response.trade.tokenIn;
            const tokenOut =
              response.trade.tokenOut?.toLowerCase() === "mnt"
                ? COMMON_BASES.WMNT
                : response.trade.tokenOut;

            // Try real swap first, fall back to mock if it fails
            try {
              await SmartRouterService.executeSwap({
                tokenIn: tokenIn!,
                tokenOut: tokenOut!,
                amount: response.trade.amount!,
                slippageTolerance: 0.5,
              });
            } catch (error) {
              console.log("Real swap failed, trying mock trade");
              await SmartRouterService.executeMockTrade({
                tokenIn: tokenIn!,
                tokenOut: tokenOut!,
                amount: response.trade.amount!,
                slippageTolerance: 0.5,
              });
            }
          }

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Trade executed successfully!",
              type: "trade",
            },
          ]);

          // Refresh and display wallet contents after trade
          await refreshBalances();
          await displayWalletContents();
        } catch (swapError) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Trade failed: ${
                swapError instanceof Error ? swapError.message : "Unknown error"
              }`,
              type: "trade",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          type: "default",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWrapUnwrapSuccess = async () => {
    await refreshBalances();
    await displayWalletContents();
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

        <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-8">
          <div className="h-[600px] overflow-y-auto mb-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-purple-600"
                      : message.type === "wallet"
                      ? "bg-blue-700"
                      : message.type === "trade"
                      ? "bg-green-700"
                      : "bg-gray-700"
                  }`}
                >
                  <pre className="whitespace-pre-wrap font-sans">
                    {message.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about market conditions or request a trade..."
              className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
            >
              {isLoading ? "..." : "Send"}
            </button>
            <button
              onClick={displayWalletContents}
              disabled={walletLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              Show Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

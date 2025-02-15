"use client";

import { useState, useEffect } from "react";
import { UniswapService } from "@/services/uniswap";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { analyzeTrade } from "../actions/groq";
import { useSwap } from "@/hooks/useSwap";
import { WalletBalance } from "@/components/WalletBalance";
import { TopPools } from "@/components/TopPools";
import { COMMON_BASES } from "@/constants/contracts";
import { TestSwapButton } from "@/components/TestSwapButton";
import { WrapMNTButton } from "@/components/WrapMNTButton";

export default function MarketPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to the DeFi trading assistant! How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { executeSwap, loading: swapLoading } = useSwap();

  const handleSend = async () => {
    if (!input.trim() || isLoading || !wallets?.[0]?.address) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await analyzeTrade(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);

      if (response.trade && response.trade.type !== "none") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Processing trade..." },
        ]);

        try {
          // Handle MNT/WMNT conversion
          const tokenIn = response.trade.tokenIn?.toLowerCase() === "mnt" 
            ? COMMON_BASES.WMNT 
            : response.trade.tokenIn;
          const tokenOut = response.trade.tokenOut?.toLowerCase() === "mnt"
            ? COMMON_BASES.WMNT
            : response.trade.tokenOut;

          await executeSwap({
            tokenIn: tokenIn!,
            tokenOut: tokenOut!,
            amount: response.trade.amount!,
            recipient: wallets[0].address,
            slippageTolerance: 0.5,
          });

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Trade executed successfully!" },
          ]);
        } catch (swapError) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Trade failed: ${
                swapError instanceof Error ? swapError.message : "Unknown error"
              }`,
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
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
              <WrapMNTButton agentAddress={wallets[0].address} />
              <TestSwapButton agentAddress={wallets[0].address} />
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
                    message.role === "user" ? "bg-purple-600" : "bg-gray-700"
                  }`}
                >
                  {message.content}
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
          </div>
        </div>
      </div>
    </div>
  );
}

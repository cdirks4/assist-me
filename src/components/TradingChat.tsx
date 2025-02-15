"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { TradeExecutor } from "@/services/tradeExecutor";
import { useAgentWallet } from "@/context/AgentWalletContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "default" | "trade" | "error";
}

export function TradingChat() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected } = useAgentWallet();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to the DeFi trading assistant! How can I help you today?",
      type: "default",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isConnected) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, type: "default" },
    ]);

    try {
      // Add processing message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Processing trade...", type: "trade" },
      ]);

      // Execute the trade
      const result = await TradeExecutor.executeTradeCommand(userMessage);

      // Add result message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message,
          type: result.success ? "trade" : "error",
        },
      ]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          type: "error",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
      <div className="space-y-4 h-96 overflow-y-auto mb-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-purple-600"
                  : message.type === "trade"
                  ? "bg-green-700"
                  : message.type === "error"
                  ? "bg-red-700"
                  : "bg-gray-700"
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
          placeholder="Type 'wrap X MNT', 'unwrap X WMNT', or ask about 'top pools', 'recent trades'..."
          className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={!isConnected}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim() || !isConnected}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

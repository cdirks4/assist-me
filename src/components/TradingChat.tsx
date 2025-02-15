"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { TradeExecutor } from "@/services/tradeExecutor";
import { useAgentWallet } from "@/context/AgentWalletContext";
import { HumanQueryService } from "@/services/humanQueryService";

interface Message {
  role: "user" | "assistant";
  content: string;
  type?: "default" | "trade" | "error" | "info";
}

export function TradingChat() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected } = useAgentWallet();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome to the DeFi trading assistant! I can help you with:\n• Trading tokens\n• Viewing top pools\n• Checking recent trades\n• Token listings\n\nTry asking 'what are the top pools' or 'show recent trades'!",
      type: "default",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, type: "default" },
    ]);

    try {
      // First try to handle as a human query
      if (userMessage.toLowerCase().includes("pool") || 
          userMessage.toLowerCase().includes("trade") || 
          userMessage.toLowerCase().includes("token")) {
        const response = await HumanQueryService.executeHumanQuery(userMessage);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response, type: "info" },
        ]);
      } else {
        // If not a query, try to execute as a trade
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Processing trade...", type: "trade" },
        ]);

        const result = await TradeExecutor.executeTradeCommand(userMessage);
        setMessages((prev) => [
          ...prev.filter((msg) => msg.content !== "Processing trade..."),
          {
            role: "assistant",
            content: result.message,
            type: result.success ? "trade" : "error",
          },
        ]);
      }
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
      <div className="space-y-4 h-96 overflow-y-auto mb-4 whitespace-pre-wrap">
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
                  : message.type === "info"
                  ? "bg-blue-700"
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
          placeholder="Try: 'what are the top pools', 'show recent trades', or 'wrap 0.1 MNT'..."
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

"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function TradingChat() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I can help you trade on Uniswap. Try saying something like 'Swap 0.1 ETH for USDC'",
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
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // TODO: Add trade execution logic
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm working on executing your trade request...",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error processing your request.",
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
          placeholder="Type your trading instruction..."
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
  );
}

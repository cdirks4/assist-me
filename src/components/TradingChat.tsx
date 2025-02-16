"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAgentWallet } from "@/context/AgentWalletContext";
import { ChatEngine, ChatMessage } from "@/services/chatEngine";
import { Button } from "./ui/Button";
import { Card, CardContent } from "./ui/Card";
import { WelcomeBanner } from "./WelcomeBanner";

export function TradingChat() {
  const { authenticated } = usePrivy();
  const { isConnected } = useAgentWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !isConnected) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      type: "default",
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Process message through ChatEngine
      const response = await ChatEngine.processMessage(messages, userMessage);

      // Add assistant's response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message,
        type: response.type,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      // Handle errors
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardContent className="p-4">
        <WelcomeBanner />
        
        <div className="space-y-4 h-96 overflow-y-auto mb-4 whitespace-pre-wrap">
          {messages.map((message, i) => (
            <div
              key={`${message.timestamp}-${i}`}
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
                    : message.type === "market"
                    ? "bg-blue-700"
                    : message.type === "wallet"
                    ? "bg-indigo-700"
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
            placeholder="Ask about markets, trade tokens, or check your wallet..."
            className="flex-1 px-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !isConnected}
            className="px-4 py-2"
          >
            {isLoading ? "..." : "Send"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

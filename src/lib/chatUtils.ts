import { ChatMessage } from "@/types/chat";

export function filterChatHistory(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(message => {
    // Exclude welcome/help messages that contain multiple bullet points
    const hasMultipleBulletPoints = 
      (message.content.match(/[•\-\*]/g) || []).length > 2;
    
    // Keep only relevant conversation messages
    return !hasMultipleBulletPoints;
  });
}

export function normalizeUserMessage(message: string): string {
  return message.trim().toLowerCase();
}

export function isTradeCommand(message: string): boolean {
  const tradeKeywords = ['swap', 'buy', 'sell', 'wrap', 'unwrap'];
  const normalizedMessage = normalizeUserMessage(message);
  return tradeKeywords.some(keyword => normalizedMessage.includes(keyword));
}

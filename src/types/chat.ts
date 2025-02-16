export type MessageRole = "user" | "assistant";
export type MessageType = "default" | "trade" | "error" | "info" | "market" | "wallet";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  type?: MessageType;
  timestamp: number;
  metadata?: {
    transactionHash?: string;
    tokenInfo?: {
      symbol?: string;
      amount?: string;
      price?: string;
    };
    marketData?: {
      tvl?: string;
      volume?: string;
      poolCount?: number;
    };
  };
}

export interface ProcessedResponse {
  message: string;
  type: MessageType;
  action?: {
    type: "trade" | "query" | "wallet" | "none";
    data?: any;
  };
}

export interface TradeIntent {
  type: "buy" | "sell" | "wrap" | "unwrap" | "none";
  tokenIn?: string;
  tokenOut?: string;
  amount?: string;
  slippage?: number;
}

export interface TradeResult {
  success: boolean;
  message: string;
  hash?: string;
  metadata?: {
    tokenIn?: string;
    tokenOut?: string;
    amount?: string;
    price?: string;
  };
}

export interface MarketContext {
  totalTVL: number;
  tokens: {
    symbol: string;
    tvl: number;
    volume: number;
  }[];
  topPools: {
    pair: string;
    tvl: number;
    volume: number;
  }[];
  recentSwaps: {
    pair: string;
    amount: number;
    timestamp: number;
  }[];
}

export interface WalletContext {
  address: string;
  balance: string;
  tokens: {
    symbol: string;
    balance: string;
    usdValue: string;
  }[];
  totalValue: string;
}

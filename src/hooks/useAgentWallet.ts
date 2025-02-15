"use client";

import { useState, useEffect } from "react";
import { agentKit } from "@/services/agentkit";
import { ethers } from "ethers";
import { uniswapService } from "@/services/uniswap";

interface TokenBalance {
  symbol: string;
  balance: string;
  usdValue: string;
  address: string;
}

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
] as const;

export function useAgentWallet() {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const agentAddress = agentKit.getWalletAddress();
      if (!agentAddress) {
        throw new Error("Agent wallet not connected");
      }

      const provider = await agentKit.provider;
      if (!provider) {
        throw new Error("Provider not available");
      }

      // Get native balance and tokens
      const [nativeBalance, tokens, pools] = await Promise.all([
        provider.getBalance(agentAddress),
        uniswapService.getTokens(),
        uniswapService.getTokenPairs(),
      ]);

      // Find MNT/USDC pool for price reference
      const mantlePool = pools.find(
        (p) =>
          (p.token0.symbol === "MNT" && p.token1.symbol === "USDC") ||
          (p.token1.symbol === "MNT" && p.token0.symbol === "USDC")
      );

      const mantlePrice = mantlePool
        ? Number(
            mantlePool.token0.symbol === "MNT"
              ? mantlePool.token1Price
              : mantlePool.token0Price
          )
        : 0;

      // Format native balance
      const formattedBalances: TokenBalance[] = [{
        symbol: "MNT",
        balance: ethers.formatEther(nativeBalance),
        usdValue: `$${(Number(ethers.formatEther(nativeBalance)) * mantlePrice).toFixed(2)}`,
        address: "native"
      }];

      // Get token balances
      const tokenBalances = await Promise.all(
        tokens.map(async (token) => {
          try {
            const contract = new ethers.Contract(
              token.id,
              ERC20_ABI,
              provider
            );

            const [balance, decimals] = await Promise.all([
              contract.balanceOf(agentAddress),
              contract.decimals()
            ]);

            const formattedBalance = ethers.formatUnits(balance, decimals);
            if (Number(formattedBalance) === 0) return null;

            const usdValue = (Number(formattedBalance) * Number(token.derivedETH)).toFixed(2);

            return {
              symbol: token.symbol,
              balance: formattedBalance,
              usdValue: `$${usdValue}`,
              address: token.id
            };
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            return null;
          }
        })
      );

      setBalances([
        ...formattedBalances,
        ...tokenBalances.filter((b): b is TokenBalance => b !== null)
      ]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return {
    balances,
    loading,
    error,
    refreshBalances: fetchBalances
  };
}

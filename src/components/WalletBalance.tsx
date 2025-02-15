"use client";

import { useEffect, useState } from "react";
import { uniswapService } from "@/services/uniswap";
import { ethers } from "ethers";
import { useAgentWallet } from "@/context/AgentWalletContext";

interface TokenBalance {
  symbol: string;
  balance: string;
  usdValue: string;
  isNative?: boolean;
}

export function WalletBalance({ address }: { address: string }) {
  const [userBalances, setUserBalances] = useState<TokenBalance[]>([]);
  const [agentBalances, setAgentBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { address: agentAddress, isConnected } = useAgentWallet();

  const fetchWalletBalances = async (walletAddress: string) => {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );

    // Get tokens and find MANTLE/USDC pool for price
    const [nativeBalance, tokens, pools] = await Promise.all([
      provider.getBalance(walletAddress),
      uniswapService.getTokens(),
      uniswapService.getTokenPairs(),
    ]);

    const mantlePool = pools.find(
      (p) =>
        (p.token0.symbol === "MNT" && p.token1.symbol === "USDC") ||
        (p.token1.symbol === "MNT" && p.token0.symbol === "USDC")
    );

    const formattedNativeBalance = ethers.formatEther(nativeBalance);
    const mantlePrice = mantlePool
      ? Number(
          mantlePool.token0.symbol === "MNT"
            ? mantlePool.token1Price
            : mantlePool.token0Price
        )
      : 0;

    const nativeUsdValue = (
      Number(formattedNativeBalance) * mantlePrice
    ).toFixed(2);

    // Get token balances
    const balancePromises = tokens.map(async (token) => {
      try {
        const contract = new ethers.Contract(
          token.id,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );

        const balance = await contract.balanceOf(walletAddress);
        const decimals = parseInt(token.decimals) || 18;
        const formattedBalance = ethers.formatUnits(balance, decimals);
        const ethPrice = Number(token.derivedETH) || 0;
        const usdValue = (Number(formattedBalance) * ethPrice).toFixed(2);

        return {
          symbol: token.symbol,
          balance: Number(formattedBalance).toFixed(4),
          usdValue: `$${usdValue}`,
        };
      } catch (error) {
        console.error(
          `Error fetching balance for token ${token.symbol}:`,
          error
        );
        return null;
      }
    });

    const results = await Promise.all(balancePromises);

    return [
      {
        symbol: "MNT",
        balance: Number(formattedNativeBalance).toFixed(6),
        usdValue: `$${nativeUsdValue}`,
        isNative: true,
      },
      ...results.filter(
        (b): b is TokenBalance => b !== null && Number(b.balance) > 0
      ),
    ];
  };

  const fetchAllBalances = async () => {
    try {
      if (!isConnected || !agentAddress) {
        throw new Error("Agent wallet not connected");
      }

      const [userWallet, agentWallet] = await Promise.all([
        fetchWalletBalances(address),
        fetchWalletBalances(agentAddress),
      ]);

      setUserBalances(userWallet);
      setAgentBalances(agentWallet);
      setError(null);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch balances");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllBalances();
  };

  useEffect(() => {
    if (address) {
      fetchAllBalances();
    }
  }, [address, agentAddress, isConnected]);

  if (loading) {
    return <div className="text-gray-400">Loading balances...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const WalletSection = ({
    title,
    balances,
  }: {
    title: string;
    balances: TokenBalance[];
  }) => (
    <div className="flex-1">
      <h3 className="text-md font-medium mb-2">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {balances.map((balance) => (
          <div
            key={balance.symbol}
            className={`bg-white/5 rounded-lg p-3 ${
              balance.isNative ? "border border-purple-500/30" : ""
            }`}
          >
            <div className="text-sm text-gray-400">{balance.symbol}</div>
            <div className="text-lg font-medium">{balance.balance}</div>
            <div className="text-sm text-gray-400">{balance.usdValue}</div>
          </div>
        ))}
        {balances.length === 0 && (
          <div className="col-span-full text-gray-400 text-center">
            No tokens found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Wallet Balances</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-white text-sm flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <WalletSection title="Your Wallet" balances={userBalances} />
        <div className="border-t md:border-l border-white/10" />
        <WalletSection title="AI Agent Wallet" balances={agentBalances} />
      </div>
    </div>
  );
}

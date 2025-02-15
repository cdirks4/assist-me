"use client";

import { useEffect, useState } from "react";
import { uniswapService } from "@/services/uniswap";
import { ethers } from "ethers";
import { agentKit } from "@/services/agentkit";

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

  useEffect(() => {
    const fetchAllBalances = async () => {
      try {
        const agentAddress = agentKit.getWalletAddress();
        if (!agentAddress) {
          throw new Error("Agent wallet not connected");
        }

        const [userWallet, agentWallet] = await Promise.all([
          fetchWalletBalances(address),
          fetchWalletBalances(agentAddress),
        ]);

        setUserBalances(userWallet);
        setAgentBalances(agentWallet);
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchAllBalances();
    }
  }, [address]);

  if (loading) {
    return <div className="text-gray-400">Loading balances...</div>;
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
      <h2 className="text-lg font-semibold mb-4">Wallet Balances</h2>
      <div className="flex flex-col md:flex-row gap-6">
        <WalletSection title="Your Wallet" balances={userBalances} />
        <div className="border-t md:border-l border-white/10" />
        <WalletSection title="AI Agent Wallet" balances={agentBalances} />
      </div>
    </div>
  );
}

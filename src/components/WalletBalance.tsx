"use client";

import { useEffect, useState } from "react";
import { uniswapService } from "@/services/uniswap";
import { ethers } from "ethers";

interface TokenBalance {
  symbol: string;
  balance: string;
  usdValue: string;
}

export function WalletBalance({ address }: { address: string }) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const tokens = await uniswapService.getTokens();
        const provider = new ethers.JsonRpcProvider(
          process.env.NEXT_PUBLIC_RPC_URL
        );

        const balancePromises = tokens.map(async (token) => {
          try {
            const contract = new ethers.Contract(
              token.id,
              ["function balanceOf(address) view returns (uint256)"],
              provider
            );

            const balance = await contract.balanceOf(address);
            // Ensure decimals is a number and has a valid value
            const decimals = parseInt(token.decimals) || 18;
            const formattedBalance = ethers.formatUnits(balance, decimals);

            // Handle potential NaN in derivedETH
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
        // Filter out null results and zero balances
        setBalances(
          results.filter(
            (b): b is TokenBalance => b !== null && Number(b.balance) > 0
          )
        );
      } catch (error) {
        console.error("Failed to fetch balances:", error);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchBalances();
    }
  }, [address]);

  if (loading) {
    return <div className="text-gray-400">Loading balances...</div>;
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
      <h2 className="text-lg font-semibold mb-3">Wallet Balances</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {balances.map((balance) => (
          <div key={balance.symbol} className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-gray-400">{balance.symbol}</div>
            <div className="text-lg font-medium">{balance.balance}</div>
            <div className="text-sm text-gray-400">{balance.usdValue}</div>
          </div>
        ))}
        {balances.length === 0 && (
          <div className="col-span-full text-gray-400 text-center">
            No tokens found in wallet
          </div>
        )}
      </div>
    </div>
  );
}

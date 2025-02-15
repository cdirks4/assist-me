"use client";

import { useEffect, useState } from "react";
import { uniswapService } from "@/services/uniswap";
import { Tooltip } from "./Tooltip";
import { SwapPoolButton } from "./SwapPoolButton";

export function TopPools() {
  const [pools, setPools] = useState<any[]>([]);

  useEffect(() => {
    const fetchPools = async () => {
      const topPools = await uniswapService.getTopPools();
      setPools(topPools);
    };
    fetchPools();
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Top Liquidity Pools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((pool) => (
          <div
            key={pool.id}
            className="p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {pool.token0.symbol}/{pool.token1.symbol}
              </span>
              <span className="text-sm text-gray-400">
                TVL: ${Number(pool.totalValueLockedUSD).toLocaleString()}
              </span>
            </div>
            <SwapPoolButton
              token0Address={pool.token0.id}
              token1Address={pool.token1.id}
              token0Symbol={pool.token0.symbol}
              token1Symbol={pool.token1.symbol}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

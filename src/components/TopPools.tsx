"use client";

import { useEffect, useState } from "react";
import { uniswapService } from "@/services/uniswap";
import { Tooltip } from "./Tooltip";

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {pools.map((pool) => (
        <Tooltip key={pool.id} text={pool.id}>
          <div className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors cursor-help">
            <h3 className="text-lg font-bold mb-2">
              {pool.token0.symbol}/{pool.token1.symbol}
            </h3>
            <p className="text-sm text-gray-400">
              Fee: {(Number(pool.feeTier) / 10000).toFixed(2)}%
            </p>
            <p className="text-sm text-gray-400">
              TVL: ${Number(pool.totalValueLockedUSD).toLocaleString()}
            </p>
          </div>
        </Tooltip>
      ))}
    </div>
  );
}

"use client";

import { useTopPools, useRecentSwaps } from "@/hooks/useUniswap";

export default function MarketOverview() {
  const { pools, loading: poolsLoading, error: poolsError } = useTopPools();
  const { swaps, loading: swapsLoading, error: swapsError } = useRecentSwaps(5);

  if (poolsLoading || swapsLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  if (poolsError || swapsError) {
    return (
      <div className="text-red-500 p-4">
        {poolsError || swapsError}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Top Pools</h2>
        <div className="space-y-4">
          {pools.map((pool) => (
            <div key={pool.id} className="p-3 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  {pool.token0.symbol}/{pool.token1.symbol}
                </div>
                <div className="text-sm text-gray-400">
                  ${Number(pool.totalValueLockedUSD).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-white/5 rounded-xl p-6 backdrop-blur-sm border border-white/10">
        <h2 className="text-xl font-semibold mb-4">Recent Swaps</h2>
        <div className="space-y-4">
          {swaps.map((swap) => (
            <div key={swap.id} className="p-3 bg-white/5 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  {swap.pool.token0.symbol} → {swap.pool.token1.symbol}
                </div>
                <div className="text-sm text-gray-400">
                  ${Number(swap.amountUSD).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(Number(swap.timestamp) * 1000).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
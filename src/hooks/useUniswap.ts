import { useState, useEffect, useMemo } from "react";
import { uniswapService } from "@/services/uniswap";
import { Pool, Token, Swap, PoolDayData } from "@/types/uniswap";

export function useTopPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const data = await uniswapService.getTokenPairs();
        setPools(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch pools");
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  return { pools, loading, error };
}

export function useTokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const data = await uniswapService.getTokens();
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tokens");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  return { tokens, loading, error };
}

export function useRecentSwaps(limit: number = 10) {
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwaps = async () => {
      try {
        const data = await uniswapService.getRecentSwaps(limit);
        setSwaps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch swaps");
      } finally {
        setLoading(false);
      }
    };

    fetchSwaps();
  }, [limit]);

  return { swaps, loading, error };
}

export function usePoolMetrics(poolId: string, days: number = 7) {
  const [metrics, setMetrics] = useState<PoolDayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await uniswapService.getPoolMetrics(poolId, days);
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      } finally {
        setLoading(false);
      }
    };

    if (poolId) {
      fetchMetrics();
    }
  }, [poolId, days]);

  return { metrics, loading, error };
}
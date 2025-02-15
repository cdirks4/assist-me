import { createClient } from "urql";
import { cacheExchange, fetchExchange } from "@urql/core";
import { SUBGRAPH_URLS } from "@/lib/constants";
import {
  Token,
  TokensResponse,
  Swap,
  Pool,
  PoolDayData,
  PoolsResponse,
  SwapsResponse,
} from "@/types/uniswap";
import { inMemoryCache } from "@/lib/inMemoryCache";
const WMNT_ADDRESS = "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8"; // Wrapped MNT on Mantle

class UniswapService {
  private client;
  private readonly CACHE_TTL = 30000;
  private readonly HISTORICAL_CACHE_TTL = 300000;

  constructor() {
    if (!SUBGRAPH_URLS["mantle-sepolia"]) {
      throw new Error("Subgraph URL not configured");
    }

    this.client = createClient({
      url: SUBGRAPH_URLS["mantle-sepolia"],
      exchanges: [cacheExchange, fetchExchange] as const,
    });
  }

  async getTokenPairs() {
    try {
      const cacheKey = "token_pairs";
      const cached = inMemoryCache.get<Pool[]>(cacheKey);
      if (cached) return cached;

      const query = `
        query {
          pools(
            first: 100,
            orderBy: totalValueLockedUSD,
            orderDirection: desc
          ) {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            totalValueLockedUSD
            volumeUSD
            token0Price
            token1Price
          }
        }
      `;

      const { data, error } = await this.client.query(query, {}).toPromise();
      if (error) {
        console.error("Failed to fetch pools:", error);
        throw new Error(`Failed to fetch pools: ${error.message}`);
      }

      const pools = data?.pools || [];
      inMemoryCache.set(cacheKey, pools, this.CACHE_TTL);
      return pools;
    } catch (error) {
      console.error("Error in getTokenPairs:", error);
      throw error;
    }
  }

  async findPoolByTokens(
    token0Address: string,
    token1Address: string
  ): Promise<Pool | null> {
    try {
      const pools = await this.getTokenPairs();
      return (
        pools.find(
          (pool) =>
            (pool.token0.id.toLowerCase() === token0Address.toLowerCase() &&
              pool.token1.id.toLowerCase() === token1Address.toLowerCase()) ||
            (pool.token0.id.toLowerCase() === token1Address.toLowerCase() &&
              pool.token1.id.toLowerCase() === token0Address.toLowerCase())
        ) || null
      );
    } catch (error) {
      console.error("Error in findPoolByTokens:", error);
      throw error;
    }
  }

  async getWMNTAddress(): Promise<string> {
    return WMNT_ADDRESS;
  }

  async getTokens(): Promise<Token[]> {
    const cacheKey = "tokens";
    const cached = inMemoryCache.get<Token[]>(cacheKey);
    if (cached) return cached;

    const query = `
      query {
        tokens(
          first: 10,
          orderBy: totalValueLockedUSD,
          orderDirection: desc,
          where: { 
            volumeUSD_gt: "100000",
            totalValueLockedUSD_gt: "100000"
          }
        ) {
          id
          symbol
          name
          decimals
          totalSupply
          volume
          volumeUSD
          feesUSD
          txCount
          poolCount
          totalValueLocked
          totalValueLockedUSD
          derivedETH
        }
      }
    `;

    const { data, error } = await this.client
      .query<TokensResponse>(query, {})
      .toPromise();

    if (error) throw new Error(`Failed to fetch tokens: ${error.message}`);
    if (!data?.tokens) return [];

    const tokens = data.tokens
      .filter(
        (token) =>
          token.id &&
          token.symbol &&
          token.decimals &&
          Number(token.totalValueLockedUSD) > 100000 &&
          Number(token.volumeUSD) > 10000
      )
      .map((token) => ({
        ...token,
        address: token.id,
      }));

    inMemoryCache.set(cacheKey, tokens, this.CACHE_TTL);
    return tokens;
  }

  async getRecentSwaps(limit: number = 10): Promise<Swap[]> {
    const cacheKey = `recent_swaps:${limit}`;
    const cached = inMemoryCache.get<Swap[]>(cacheKey);
    if (cached) return cached;

    const query = `
      query {
        swaps(
          first: ${limit},
          orderBy: timestamp,
          orderDirection: desc,
          where: { amountUSD_gt: "0" }
        ) {
          id
          timestamp
          amount0
          amount1
          amountUSD
          pool {
            token0 {
              symbol
            }
            token1 {
              symbol
            }
          }
        }
      }
    `;

    const { data, error } = await this.client.query(query, {}).toPromise();
    if (error) throw new Error(`Failed to fetch swaps: ${error.message}`);

    const swaps = data?.swaps || [];
    inMemoryCache.set(cacheKey, swaps, this.CACHE_TTL);
    return swaps;
  }

  async getPoolMetrics(poolId: string, days: number = 7) {
    const cacheKey = `pool_metrics:${poolId}:${days}`;
    const cached = inMemoryCache.get<PoolDayData[]>(cacheKey);
    if (cached) return cached;

    const timestamp = Math.floor((Date.now() - days * 86400 * 1000) / 1000);

    const query = `
      query GetPoolMetrics($poolId: ID!, $timestamp: Int!) {
        pool(id: $poolId) {
          poolDayData(
            where: { date_gt: $timestamp }
            orderBy: date
            orderDirection: asc
          ) {
            date
            tvlUSD
            volumeUSD
            feesUSD
            token0Price
            token1Price
            high
            low
            close
          }
        }
      }
    `;

    const { data, error } = await this.client
      .query(query, { poolId, timestamp })
      .toPromise();

    if (error)
      throw new Error(`Failed to fetch pool metrics: ${error.message}`);

    const metrics = data?.pool?.poolDayData || [];
    inMemoryCache.set(cacheKey, metrics, this.HISTORICAL_CACHE_TTL);
    return metrics;
  }
  async getTopPools(limit: number = 6) {
    const cacheKey = `top_pools:${limit}`;
    const cached = inMemoryCache.get<Pool[]>(cacheKey);
    if (cached) return cached;

    const query = `
      query {
        pools(
          first: ${limit}
          orderBy: totalValueLockedUSD
          orderDirection: desc
          where: { totalValueLockedUSD_gt: "0" }
        ) {
          id
          token0 {
            id
            symbol
            decimals
          }
          token1 {
            id
            symbol
            decimals
          }
          feeTier
          totalValueLockedUSD
          token0Price
          token1Price
        }
      }
    `;

    const { data, error } = await this.client.query(query, {}).toPromise();

    if (error) throw new Error(`Failed to fetch top pools: ${error.message}`);

    const pools = data?.pools || [];
    inMemoryCache.set(cacheKey, pools, this.CACHE_TTL);
    return pools;
  }
}

// Create a single instance of the service
export const uniswapService = new UniswapService();

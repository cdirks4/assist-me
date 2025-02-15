import { createClient } from "urql";
import { SUBGRAPH_URLS } from "@/lib/constants";
import { cacheExchange, fetchExchange } from "@urql/core";

interface V3Tick {
  tick: string;
  liquidityNet: string;
  liquidityGross: string;
}

interface V3TicksResponse {
  ticks: V3Tick[];
}

class SubgraphService {
  private client;

  constructor() {
    this.client = createClient({
      url: SUBGRAPH_URLS["mantle-sepolia"],
      exchanges: [cacheExchange, fetchExchange],
    });
  }

  async fetchAllV3Ticks(
    poolAddress: string,
    lastTick: number,
    pageSize: number
  ): Promise<V3Tick[]> {
    try {
      const query = `
        query AllV3Ticks($poolAddress: String!, $lastTick: Int!, $pageSize: Int!) {
          ticks(
            first: $pageSize,
            where: {
              poolAddress: $poolAddress,
              tickIdx_gt: $lastTick,
            },
            orderBy: tickIdx
          ) {
            tick: tickIdx
            liquidityNet
            liquidityGross
          }
        }
      `;

      const { data, error } = await this.client
        .query<{ ticks: V3Tick[] }>(query, {
          poolAddress,
          lastTick,
          pageSize,
        })
        .toPromise();

      if (error) {
        console.error("Failed to fetch ticks:", error);
        throw new Error(`Failed to fetch ticks: ${error.message}`);
      }

      return data?.ticks || [];
    } catch (error) {
      console.error("Error in fetchAllV3Ticks:", error);
      throw error;
    }
  }
}

export const subgraphService = new SubgraphService();

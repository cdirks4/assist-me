import { agentKit } from "./agentkit";
import { ethers } from "ethers";
import { uniswapService } from "./uniswap";

export async function getAgentWalletSummary(): Promise<string> {
  try {
    const address = agentKit.getWalletAddress();
    if (!address) {
      return "No agent wallet is currently connected.";
    }

    const provider = await agentKit.provider;
    if (!provider) {
      return "Unable to connect to the network.";
    }

    // Get native balance and tokens
    const [nativeBalance, tokens, pools] = await Promise.all([
      provider.getBalance(address),
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

    const formattedNativeBalance = ethers.formatEther(nativeBalance);
    const nativeUsdValue = (Number(formattedNativeBalance) * mantlePrice).toFixed(2);

    let summary = `Agent Wallet Balance:\n`;
    summary += `MNT: ${Number(formattedNativeBalance).toFixed(4)} ($${nativeUsdValue})\n`;

    // Get token balances
    const tokenBalances = await Promise.all(
      tokens.map(async (token) => {
        try {
          const contract = new ethers.Contract(
            token.id,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );

          const balance = await contract.balanceOf(address);
          const formattedBalance = ethers.formatUnits(balance, token.decimals);
          
          if (Number(formattedBalance) > 0) {
            const usdValue = (Number(formattedBalance) * Number(token.derivedETH) * mantlePrice).toFixed(2);
            return `${token.symbol}: ${Number(formattedBalance).toFixed(4)} ($${usdValue})`;
          }
          return null;
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          return null;
        }
      })
    );

    const validTokenBalances = tokenBalances.filter((balance): balance is string => balance !== null);
    if (validTokenBalances.length > 0) {
      summary += validTokenBalances.join('\n');
    }

    return summary;
  } catch (error) {
    console.error("Error getting wallet summary:", error);
    return "Failed to fetch wallet balances. Please try again later.";
  }
}

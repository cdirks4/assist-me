import { ethers } from "ethers";
import { POOL_ABI, COMMON_BASES } from "@/constants/contracts";
import { uniswapService } from "./uniswap";

export class SwapService {
  static async swapExactTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      // Get the top pool for these tokens
      const pool = await uniswapService.findPoolByTokens(tokenIn, tokenOut);
      if (!pool) throw new Error("No pool found for token pair");

      // Create pool contract instance
      const poolContract = new ethers.Contract(pool.id, POOL_ABI, signer);

      // Determine swap direction
      const token0 = await poolContract.token0();
      const zeroForOne = tokenIn.toLowerCase() === token0.toLowerCase();

      // Convert amount to wei
      const amountWei = ethers.parseEther(amountIn);

      // Get current price from slot0
      const slot0 = await poolContract.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;

      // Calculate price limit (allow 2% slippage)
      const sqrtPriceLimitX96 = zeroForOne
        ? sqrtPriceX96 - (sqrtPriceX96 * 2n) / 100n
        : sqrtPriceX96 + (sqrtPriceX96 * 2n) / 100n;

      // Execute swap
      const tx = await poolContract.swap(
        await signer.getAddress(),
        zeroForOne,
        amountWei,
        sqrtPriceLimitX96,
        "0x",
        {
          gasLimit: BigInt("300000"),
          chainId: 5003,
        }
      );

      console.log("Swap transaction sent:", tx.hash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Swap failed:", error);
      throw error;
    }
  }
}

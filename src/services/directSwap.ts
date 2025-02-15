import { ethers } from "ethers";
import { providerService } from "./provider";
import { uniswapService } from "./uniswap";
import { POOL_ABI, COMMON_BASES } from "@/constants/contracts";
import { agentKit } from "./agentkit";

interface DirectSwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
}

export class DirectSwapService {
  static async executeDirectSwap({
    tokenIn,
    tokenOut,
    amount,
    slippageTolerance = 0.5,
  }: DirectSwapParams): Promise<string> {
    try {
      console.log("Starting swap with params:", {
        tokenIn,
        tokenOut,
        amount,
        slippageTolerance,
      });
      
      // Normalize token addresses
      const normalizedTokenIn = tokenIn.toLowerCase();
      const normalizedTokenOut = tokenOut.toLowerCase();
      
      const signer = agentKit.getSigner();
      const signerAddress = await signer.getAddress();
      console.log("Signer address:", signerAddress);

      // Find the pool with normalized addresses
      const pool = await uniswapService.findPoolByTokens(normalizedTokenIn, normalizedTokenOut);
      if (!pool) {
        throw new Error(
          "No liquidity pool exists for the provided token pair. Please verify the tokens and ensure there is sufficient liquidity."
        );
      }
      console.log("Found pool:", pool.id);

      // Create contracts
      const poolContract = new ethers.Contract(pool.id, POOL_ABI, signer);
      const tokenInContract = new ethers.Contract(
        normalizedTokenIn,
        [
          "function decimals() external view returns (uint8)",
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)",
        ],
        signer
      );

      // Get decimals and parse amount
      const decimals = await tokenInContract.decimals();
      console.log("Token decimals:", decimals);
      const amountIn = ethers.parseUnits(amount, decimals);
      console.log("Amount in wei:", amountIn.toString());

      // Calculate minimum output based on slippage
      const minOutput =
        amountIn -
        (amountIn * BigInt(Math.floor(slippageTolerance * 100))) /
          BigInt(10000);
      console.log("Minimum output with slippage:", minOutput.toString());

      // Get swap direction using normalized addresses
      const token0 = (await poolContract.token0()).toLowerCase();
      const zeroForOne = normalizedTokenIn === token0;
      console.log("Swap direction:", { token0, zeroForOne });

      // Check and set approval
      const allowance = await tokenInContract.allowance(signerAddress, pool.id);
      console.log("Current allowance:", allowance.toString());

      if (allowance < amountIn) {
        console.log("Insufficient allowance, approving pool...");
        const approveTx = await tokenInContract.approve(pool.id, amountIn);
        console.log("Approval transaction sent:", approveTx.hash);
        const approveReceipt = await approveTx.wait();
        console.log("Approval confirmed in block:", approveReceipt.blockNumber);
      } else {
        console.log("Sufficient allowance exists");
      }

      // Get current price and calculate reasonable price limits
      const slot0 = await poolContract.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;

      // Use more conservative price limits
      const sqrtPriceLimitX96 = zeroForOne
        ? BigInt("4295128740")
        : BigInt("1461446703485210103287273052203988822378723970341");

      // Use positive amount for input
      const swapAmount = BigInt(
        Math.floor(0.1 * Number(10n ** BigInt(decimals)))
      );
      console.log("Swap configuration:", {
        pool: pool.id,
        recipient: signerAddress,
        zeroForOne,
        amount: swapAmount.toString(),
        priceLimit: sqrtPriceLimitX96.toString(),
      });

      const tx = await poolContract.swap(
        signerAddress,
        zeroForOne,
        swapAmount,
        sqrtPriceLimitX96,
        "0x",
        {
          gasLimit: ethers.parseUnits("0.2", "gwei"),
          chainId: 5003,
          gasPrice: ethers.parseUnits("0.1", "gwei"),
        }
      );

      console.log("Direct swap transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Swap confirmed in block:", receipt.blockNumber);
      return receipt.hash;
    } catch (error) {
      console.error("Direct swap failed with error:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }
}

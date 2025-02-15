import { ethers } from "ethers";
import {
  FUSIONX_V3_CONTRACTS,
  SWAP_ROUTER_ABI,
  POOL_FEES,
  COMMON_BASES,
  WMNT_ABI,
} from "@/constants/contracts";
import { FACTORY_ABI } from "@/constants/factoryAbi";
import { agentKit } from "./agentkit";
import { subgraphService } from "./subgraph";

interface RouterSwapParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
}

export class RouterSwapService {
  static async executeSwap({
    tokenIn,
    tokenOut,
    amount,
    slippageTolerance = 0.5,
  }: RouterSwapParams): Promise<string> {
    try {
      // Normalize token addresses
      const normalizedTokenIn = tokenIn.toLowerCase();
      const normalizedTokenOut = tokenOut.toLowerCase();

      const signer = agentKit.getSigner();
      const signerAddress = await signer.getAddress();

      // Create router contract
      const router = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.SWAP_ROUTER,
        SWAP_ROUTER_ABI,
        signer
      );

      // Create token contract for approval
      const tokenContract = new ethers.Contract(
        normalizedTokenIn,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)",
          "function decimals() external view returns (uint8)",
        ],
        signer
      );

      // Get decimals and parse amount
      const decimals = await tokenContract.decimals();
      const amountIn = ethers.parseUnits(amount, decimals);

      // Create factory contract instance and get pool
      const factory = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.FACTORY,
        FACTORY_ABI,
        signer
      );
      
      const pool = await factory.getPool(normalizedTokenIn, normalizedTokenOut, POOL_FEES.MEDIUM);
      if (!pool || pool === ethers.ZeroAddress) {
        throw new Error(
          "No liquidity pool exists for the provided token pair. Please try with different tokens or check if there is sufficient liquidity."
        );
      }
      
      const ticks = await subgraphService.fetchAllV3Ticks(pool, -887272, 100);
      if (!ticks || ticks.length === 0) {
        throw new Error("Unable to fetch pool ticks. The pool may not be properly initialized.");
      }

      const currentTick = ticks[0]?.tick ? parseInt(ticks[0].tick) : 0;
      
      // Calculate minimum output based on tick data
      const tickSpacing = 60;
      const maxTickDeviation = 2 * tickSpacing;
      const slippageFromTicks = (maxTickDeviation / currentTick) * 100;
      const effectiveSlippage = Math.max(slippageFromTicks, slippageTolerance);
      
      const amountOutMinimum = amountIn - (amountIn * BigInt(Math.floor(effectiveSlippage * 100))) / BigInt(10000);

      // Check and set approval
      const allowance = await tokenContract.allowance(
        signerAddress,
        FUSIONX_V3_CONTRACTS.SWAP_ROUTER
      );
      if (allowance < amountIn) {
        const approveTx = await tokenContract.approve(
          FUSIONX_V3_CONTRACTS.SWAP_ROUTER,
          amountIn
        );
        await approveTx.wait();
      }

      // Prepare multicall data
      const deadline = Math.floor(Date.now() / 1000) + 1800;
      const calls: string[] = [];

      // Add deposit call if using native token
      if (normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase()) {
        const wethContract = new ethers.Contract(COMMON_BASES.WMNT, WMNT_ABI, signer);
        calls.push(wethContract.interface.encodeFunctionData("deposit"));
      }

      // Add transfer call if needed
      if (normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase()) {
        const wethContract = new ethers.Contract(COMMON_BASES.WMNT, WMNT_ABI, signer);
        calls.push(
          wethContract.interface.encodeFunctionData("transfer", [
            FUSIONX_V3_CONTRACTS.SWAP_ROUTER,
            amountIn,
          ])
        );
      }

      // Add swap call
      const swapParams = {
        tokenIn: normalizedTokenIn,
        tokenOut: normalizedTokenOut,
        fee: POOL_FEES.MEDIUM,
        recipient: signerAddress,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96: 0,
      };

      calls.push(router.interface.encodeFunctionData("exactInputSingle", [swapParams]));

      // Execute multicall with fixed gas limit
      const tx = await router.multicall(calls, {
        value: normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase() ? amountIn : 0,
        gasLimit: 810208730n,
        type: 0,
      });

      console.log("Multicall transaction sent:", tx.hash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Router swap failed:", error);
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

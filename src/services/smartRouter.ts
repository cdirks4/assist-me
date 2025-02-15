import { ethers } from "ethers";
import {
  FUSIONX_V3_CONTRACTS,
  SMART_ROUTER_ABI,
  COMMON_BASES,
  WMNT_ABI,
  POOL_FEES,
} from "@/constants/contracts";
import { agentKit } from "./agentkit";

interface SmartRouterParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  slippageTolerance?: number;
}

interface SwapParameters {
  tokenIn: string;
  tokenOut: string;
  fee: number;
  recipient: string;
  deadline: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  sqrtPriceLimitX96: bigint;
}

export class SmartRouterService {
  static async executeMockTrade({
    tokenIn,
    tokenOut,
    amount,
    slippageTolerance = 0.5,
  }: SmartRouterParams): Promise<string> {
    const { mockTradeService } = await import("@/services/mockTrade");
    return mockTradeService.executeMockTrade({
      tokenIn,
      tokenOut,
      amount,
      slippageTolerance,
    });
  }

  static async executeMulticallSwap(
    tokenIn: string,
    tokenOut: string,
    amount: string,
    deadline: number
  ): Promise<string> {
    try {
      const signer = agentKit.getSigner();
      const signerAddress = await signer.getAddress();

      // Normalize addresses
      const normalizedTokenIn = tokenIn.toLowerCase();
      const normalizedTokenOut = tokenOut.toLowerCase();

      // Create contract instances
      const router = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.SMART_ROUTER,
        SMART_ROUTER_ABI,
        signer
      );

      const amountIn = ethers.parseUnits(amount, 18);
      const calls: string[] = [];

      // Handle native MNT wrapping if needed
      if (normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase()) {
        const wmntContract = new ethers.Contract(
          COMMON_BASES.WMNT,
          WMNT_ABI,
          signer
        );
        calls.push(wmntContract.interface.encodeFunctionData("deposit"));
      }

      // Handle token approval if needed
      if (normalizedTokenIn !== COMMON_BASES.WMNT.toLowerCase()) {
        const tokenContract = new ethers.Contract(
          normalizedTokenIn,
          WMNT_ABI,
          signer
        );
        const allowance = await tokenContract.allowance(
          signerAddress,
          FUSIONX_V3_CONTRACTS.SMART_ROUTER
        );

        if (allowance < amountIn) {
          calls.push(
            tokenContract.interface.encodeFunctionData("approve", [
              FUSIONX_V3_CONTRACTS.SMART_ROUTER,
              amountIn,
            ])
          );
        }
      }

      // Calculate minimum output based on 0.5% slippage
      const amountOutMinimum =
        amountIn - (amountIn * BigInt(50)) / BigInt(10000);

      // Import and use the sqrt price limit utility
      const { getDefaultSqrtPriceLimit } = await import("@/lib/sqrtPriceUtils");
      const sqrtPriceLimitX96 = getDefaultSqrtPriceLimit(
        normalizedTokenIn,
        normalizedTokenOut
      );

      // Prepare swap parameters
      const swapParams = {
        tokenIn: normalizedTokenIn,
        tokenOut: normalizedTokenOut,
        fee: POOL_FEES.MEDIUM,
        recipient: signerAddress,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96,
      };

      // Add the swap call
      calls.push(router.interface.encodeFunctionData("exactInputSingle", [swapParams]));

      console.log("Executing multicall with params:", {
        calls: calls.length,
        deadline,
        value: normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase() ? amountIn : 0n,
      });

      // Execute the multicall
      const tx = await router.multicall(calls, {
        gasLimit: 810208730n,
        value: normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase() ? amountIn : 0n,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return receipt.hash;
    } catch (error: any) {
      console.error("Smart router multicall swap failed:", error);

      if (error.code === "CALL_EXCEPTION") {
        const enrichedError = new Error(
          `Swap execution failed: ${error.message}\nPossible causes:\n` +
            "- Insufficient balance\n" +
            "- Price impact too high\n" +
            "- Pool liquidity constraints"
        );
        Object.assign(enrichedError, error);
        throw enrichedError;
      }

      throw error;
    }
  }

  static async executeSwap({
    tokenIn,
    tokenOut,
    amount,
    slippageTolerance = 0.5,
  }: SmartRouterParams): Promise<string> {
    try {
      const signer = agentKit.getSigner();
      const signerAddress = await signer.getAddress();

      // Normalize addresses
      const normalizedTokenIn = tokenIn.toLowerCase();
      const normalizedTokenOut = tokenOut.toLowerCase();

      // Create contract instances
      const router = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.SMART_ROUTER,
        SMART_ROUTER_ABI,
        signer
      );

      const tokenContract = new ethers.Contract(
        normalizedTokenIn,
        WMNT_ABI,
        signer
      );

      const amountIn = ethers.parseUnits(amount, 18);
      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes

      // Check and set approval if needed
      const allowance = await tokenContract.allowance(
        signerAddress,
        FUSIONX_V3_CONTRACTS.SMART_ROUTER
      );

      if (allowance < amountIn) {
        console.log("Approving router...");
        const approveTx = await tokenContract.approve(
          FUSIONX_V3_CONTRACTS.SMART_ROUTER,
          amountIn,
          {
            gasLimit: 810208730n,
          }
        );
        await approveTx.wait();
      }

      // Calculate minimum output based on slippage
      const amountOutMinimum =
        amountIn -
        (amountIn * BigInt(Math.floor(slippageTolerance * 100))) /
          BigInt(10000);

      // Import the sqrt price limit utility
      const { getDefaultSqrtPriceLimit } = await import("@/lib/sqrtPriceUtils");

      // Get appropriate sqrt price limit based on swap direction
      const sqrtPriceLimitX96 = getDefaultSqrtPriceLimit(normalizedTokenIn, normalizedTokenOut);

      // Prepare swap parameters
      const swapParams: SwapParameters = {
        tokenIn: normalizedTokenIn,
        tokenOut: normalizedTokenOut,
        fee: POOL_FEES.MEDIUM,
        recipient: signerAddress,
        deadline,
        amountIn,
        amountOutMinimum,
        sqrtPriceLimitX96,
      };

      console.log("Executing swap with params:", {
        ...swapParams,
        amountIn: swapParams.amountIn.toString(),
        amountOutMinimum: swapParams.amountOutMinimum.toString(),
        sqrtPriceLimitX96: swapParams.sqrtPriceLimitX96.toString(),
      });

      // Execute the swap
      const tx = await router.exactInputSingle(swapParams, {
        gasLimit: 810208730n,
        value:
          normalizedTokenIn === COMMON_BASES.WMNT.toLowerCase() ? amountIn : 0n,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return receipt.hash;
    } catch (error: any) {
      console.error("Smart router swap failed:", error);

      if (error.code === "CALL_EXCEPTION") {
        const enrichedError = new Error(
          `Swap execution failed: ${error.message}\nPossible causes:\n` +
            "- Insufficient balance\n" +
            "- Price impact too high\n" +
            "- Pool liquidity constraints"
        );
        Object.assign(enrichedError, error);
        throw enrichedError;
      }

      throw error;
    }
  }

  static async executeSimpleSwap(amount: string): Promise<string> {
    try {
      const signer = agentKit.getSigner();
      const signerAddress = await signer.getAddress();

      // First wrap MNT to WMNT
      const wmntContract = new ethers.Contract(
        COMMON_BASES.WMNT,
        WMNT_ABI,
        signer
      );

      const amountIn = ethers.parseUnits(amount, 18);

      // First wrap MNT
      console.log("Wrapping MNT...");
      const wrapTx = await wmntContract.deposit({
        value: amountIn,
        gasLimit: 810208730n,
      });
      await wrapTx.wait();

      // Then approve router
      console.log("Approving router...");
      const approveTx = await wmntContract.approve(
        FUSIONX_V3_CONTRACTS.SMART_ROUTER,
        amountIn,
        {
          gasLimit: 810208730n,
        }
      );
      await approveTx.wait();

      // Finally execute the swap
      console.log("Executing swap...");
      const router = new ethers.Contract(
        FUSIONX_V3_CONTRACTS.SMART_ROUTER,
        SMART_ROUTER_ABI,
        signer
      );

      const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now

      // Import the sqrt price limit utility
      const { getDefaultSqrtPriceLimit } = await import("@/lib/sqrtPriceUtils");

      // Get appropriate sqrt price limit for WMNT to MUSDT swap
      const sqrtPriceLimitX96 = getDefaultSqrtPriceLimit(COMMON_BASES.WMNT, COMMON_BASES.MUSDT);

      const swapParams: SwapParameters = {
        tokenIn: COMMON_BASES.WMNT,
        tokenOut: COMMON_BASES.MUSDT,
        fee: POOL_FEES.MEDIUM,
        recipient: signerAddress,
        deadline,
        amountIn,
        amountOutMinimum: 0n,
        sqrtPriceLimitX96,
      };

      console.log("Executing swap with params:", {
        ...swapParams,
        amountIn: swapParams.amountIn.toString(),
        amountOutMinimum: swapParams.amountOutMinimum.toString(),
        sqrtPriceLimitX96: swapParams.sqrtPriceLimitX96.toString(),
      });

      const tx = await router.exactInputSingle(swapParams, {
        gasLimit: 810208730n,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });

      return receipt.hash;
    } catch (error: any) {
      console.error("Simple swap failed:", error);

      if (error.code === "CALL_EXCEPTION") {
        const enrichedError = new Error(
          `Swap execution failed: ${error.message}\nPossible causes:\n` +
            "- Insufficient balance\n" +
            "- Price impact too high\n" +
            "- Pool liquidity constraints"
        );
        Object.assign(enrichedError, error);
        throw enrichedError;
      }

      throw error;
    }
  }
}

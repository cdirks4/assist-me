/**
 * Utility functions for handling sqrt price calculations in Uniswap V3 swaps
 */

// Constants for sqrt price limits based on Uniswap V3 tick ranges
const MIN_SQRT_RATIO = BigInt("4295128739") // Corresponds to MIN_TICK
const MAX_SQRT_RATIO = BigInt("1461446703485210103287273052203988822378723970342") // Corresponds to MAX_TICK

/**
 * Determines if the swap is "zero for one" based on token addresses
 * @param tokenIn Input token address
 * @param tokenOut Output token address
 * @returns boolean indicating if the swap is zero for one
 */
export function isZeroForOne(tokenIn: string, tokenOut: string): boolean {
  return tokenIn.toLowerCase() < tokenOut.toLowerCase();
}

/**
 * Gets the appropriate sqrt price limit for a swap based on direction
 * @param tokenIn Input token address
 * @param tokenOut Output token address
 * @returns The appropriate sqrt price limit as a BigInt
 */
export function getDefaultSqrtPriceLimit(tokenIn: string, tokenOut: string): bigint {
  // If tokenIn < tokenOut (zero for one), we need the minimum sqrt price
  // Otherwise (one for zero), we need the maximum sqrt price
  return isZeroForOne(tokenIn, tokenOut) ? MIN_SQRT_RATIO : MAX_SQRT_RATIO;
}

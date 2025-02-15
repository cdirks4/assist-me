import { ethers } from "ethers";
import { providerService } from "./provider";

export class WalletService {
  static async fundWallet(
    recipientAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const provider = await providerService.getProvider();
      const amountWei = ethers.parseEther(amount);

      // Get gas estimate
      const gasEstimate = await provider.estimateGas({
        to: recipientAddress,
        value: amountWei,
      });

      // Send transaction
      const tx = await signer.sendTransaction({
        to: recipientAddress,
        value: amountWei,
        gasLimit: gasEstimate,
      });

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      throw error;
    }
  }
}

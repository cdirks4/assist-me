import { ethers } from "ethers";
import { type Wallet } from "@privy-io/react-auth";

export class FundingService {
  static async sendTransaction(
    recipientAddress: string,
    amount: string,
    wallet: Wallet
  ): Promise<boolean> {
    try {
      if (!wallet?.address) {
        throw new Error("Invalid wallet");
      }

      // Send transaction using the connected wallet
      const tx = await wallet.sendTransaction({
        to: recipientAddress,
        value: ethers.parseEther(amount),
        gasLimit: 21000,
      });

      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to send transaction:", error);
      throw error;
    }
  }
}

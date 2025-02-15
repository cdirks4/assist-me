import { ethers } from "ethers";
import { providerService } from "./provider";
import { COMMON_BASES, WMNT_ABI } from "@/constants/contracts";

export class WalletService {
  static async wrapMNT(amount: string, signer: ethers.Signer): Promise<string> {
    try {
      const amountWei = ethers.parseEther(amount);
      const wmnt = new ethers.Contract(COMMON_BASES.WMNT, WMNT_ABI, signer);
      const signerAddress = await signer.getAddress();

      console.log("Attempting to wrap:", amount, "MNT");

      // Proceed with deposit
      const estimatedGas = await wmnt.deposit.estimateGas({
        value: amountWei,
      });
      const gasLimit = (estimatedGas * 120n) / 100n;
      console.log("Estimated gas (with 20% buffer):", gasLimit.toString());
      const tx = await wmnt.deposit({
        value: amountWei,
        gasLimit: gasLimit,
        chainId: 5003,
      });

      console.log("Wrapping MNT transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("MNT wrapped successfully");

      return receipt.hash;
    } catch (error) {
      console.error("Failed to wrap MNT:", error);
      throw error;
    }
  }

  static async fundWallet(
    recipientAddress: string,
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const provider = await providerService.getProvider();
      const amountWei = ethers.parseEther(amount);

      // Check sender's balance first
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      console.log("Balance:", ethers.formatEther(balance), "MNT");
      console.log("Attempting to send:", amount, "MNT");

      // Use minimal gas settings for Mantle
      const gasLimit = BigInt("0x5208"); // 21000 in hex
      const gasPrice = BigInt("0x2540BE400"); // 10 gwei in hex
      const gasCost = gasLimit * gasPrice;
      const totalNeeded = amountWei + gasCost;

      if (balance < totalNeeded) {
        const maxSendable = balance - gasCost;
        throw new Error(
          `Insufficient funds. Balance: ${ethers.formatEther(balance)} MNT, ` +
            `Maximum sendable: ${ethers.formatEther(maxSendable)} MNT`
        );
      }

      // Send raw transaction with higher gas price
      const tx = await signer.sendTransaction({
        from: address,
        to: recipientAddress,
        value: amountWei,
        gasLimit: 810208730n,
        gasPrice: gasPrice,
        chainId: 5003,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error("Failed to fund wallet:", error);
      throw error;
    }
  }

  static async unwrapWMNT(
    amount: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const amountWei = ethers.parseEther(amount);
      const wmnt = new ethers.Contract(COMMON_BASES.WMNT, WMNT_ABI, signer);

      // Estimate gas for unwrap
      const estimatedGas = await wmnt.withdraw.estimateGas(amountWei);
      const gasLimit = (estimatedGas * 120n) / 100n;
      console.log("Estimated gas (with 20% buffer):", gasLimit.toString());

      // Withdraw WMNT to get MNT back
      const tx = await wmnt.withdraw(amountWei, {
        gasLimit: gasLimit,
        chainId: 5003,
      });

      console.log("Unwrapping WMNT transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("WMNT unwrapped successfully");

      return receipt.hash;
    } catch (error) {
      console.error("Failed to unwrap WMNT:", error);
      throw error;
    }
  }
}

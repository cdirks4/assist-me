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
      // Check and set approval first
      const currentAllowance = await wmnt.allowance(
        signerAddress,
        COMMON_BASES.WMNT
      );
      console.log(
        "Current allowance:",
        ethers.formatEther(currentAllowance),
        "WMNT"
      );

      //   if (currentAllowance < amountWei) {
      //     console.log("Setting approval for WMNT...");
      //     console.log(
      //       "Amount to approve:",
      //       ethers.formatEther(amountWei),
      //       "WMNT"
      //     );
      //     console.log("Spender address:", COMMON_BASES.WMNT);

      //     const approveTx = await wmnt.approve(COMMON_BASES.WMNT, amountWei, {
      //       gasLimit: BigInt("0x5208"),
      //       gasPrice: BigInt("0x2540BE400"),
      //       chainId: 5003,
      //     });
      //     console.log("Approval transaction sent:", approveTx.hash);

      //     const approveReceipt = await approveTx.wait();
      //     console.log("Approval confirmed in block:", approveReceipt.blockNumber);
      //   } else {
      //     console.log("Sufficient allowance already exists");
      //   }

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
        gasLimit: gasLimit,
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
}

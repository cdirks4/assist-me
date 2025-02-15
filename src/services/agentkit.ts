import { ethers } from "ethers";
import { storageService } from "./storage";
import { providerService } from "./provider";
import { FundingService } from "./funding";
import { WalletService } from "./wallet";
import { swapService } from './swapService';

interface WalletHealth {
  isConnected: boolean;
  balance: string;
  allowance: string;
}

export class AgentKitService {
  private wallet: ethers.Wallet | null = null;
  private _provider: ethers.Provider | null = null;

  get provider(): ethers.Provider | null {
    return this._provider;
  }

  getSigner(): ethers.Wallet {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }
    return this.wallet;
  }

  async connectWallet(
    userId: string,
    createIfNotExist: boolean = true
  ): Promise<boolean> {
    try {
      if (this.wallet) {
        return true;
      }

      const existingWallet = storageService.getWalletByUserId(userId);
      const provider = await this.ensureProvider();

      if (existingWallet) {
        try {
          const privateKey = await this.decryptPrivateKey(
            existingWallet.encryptedPrivateKey
          );

          if (!privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
            if (!createIfNotExist) return false;
          }

          this.wallet = new ethers.Wallet(privateKey, provider);
          storageService.updateLastAccessed(this.wallet.address);
          return true;
        } catch (error) {
          if (!createIfNotExist) {
            return false;
          }
        }
      }

      if (createIfNotExist) {
        const newWallet = ethers.Wallet.createRandom().connect(provider);
        this.wallet = newWallet;

        const encryptedKey = await this.encryptPrivateKey(
          newWallet.privateKey,
          userId
        );

        storageService.storeWallet({
          address: newWallet.address,
          encryptedPrivateKey: encryptedKey,
          userId,
          createdAt: new Date().toISOString(),
          lastAccessed: new Date().toISOString(),
        });

        if (createIfNotExist && this.wallet) {
          // Fund the newly created wallet
          await WalletService.fundNewWallet(this.wallet.address, "1", signer);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  private async encryptPrivateKey(
    privateKey: string,
    userId: string
  ): Promise<string> {
    return btoa(`${privateKey}:${userId}`);
  }

  private async decryptPrivateKey(encryptedKey: string): Promise<string> {
    try {
      const decoded = atob(encryptedKey);
      const [privateKey, userId] = decoded.split(":");

      if (!privateKey || !userId) {
        throw new Error("Invalid encrypted key format");
      }

      return privateKey;
    } catch (error) {
      throw new Error("Failed to decrypt wallet key");
    }
  }

  private async ensureProvider(): Promise<ethers.Provider> {
    try {
      if (!this._provider) {
        this._provider = await providerService.getProvider();
      }
      return this._provider;
    } catch (error) {
      throw new Error("Could not establish network connection");
    }
  }

  async getBalance(): Promise<string> {
    try {
      if (!this.wallet) {
        return "0";
      }

      const provider = await this.ensureProvider();
      const balance = await provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      return "0";
    }
  }

  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  async swapTokens(
    tokenIn: string,
    tokenOut: string,
    amount: string,
    slippageTolerance: number = 0.5
  ): Promise<any> {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }

    try {
      const address = this.getWalletAddress();
      if (!address) {
        throw new Error("No wallet address available");
      }

      console.log(`Attempting to swap ${amount} ${tokenIn} for ${tokenOut}`);
      
      const result = await swapService.executeSwap({
        tokenIn,
        tokenOut,
        amount,
        recipient: address,
        slippageTolerance
      });

      return result;
    } catch (error) {
      console.error("Failed to execute swap:", error);
      throw error;
    }
  }

  async transferFunds(
    toAddress: string,
    amount: string | number
  ): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }

    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid recipient address");
    }

    const provider = await this.ensureProvider();
    const gasPrice = await provider.getFeeData();
    const gasLimit = 21000n;
    const gasCost = gasLimit * (gasPrice.gasPrice || 0n);
    const balance = await provider.getBalance(this.wallet.address);

    const maxTransferable = balance - gasCost;
    const ninetyPercent = (maxTransferable * 90n) / 100n;

    return await this.wallet.sendTransaction({
      to: toAddress,
      value: ninetyPercent,
      gasLimit,
    });
  }

  async signContract(
    contractAddress: string,
    abi: ethers.InterfaceAbi,
    methodName: string,
    params: any[]
  ): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }

    const provider = await this.ensureProvider();
    const contract = new ethers.Contract(contractAddress, abi, this.wallet);

    console.debug("Signing contract interaction:", {
      contract: contractAddress,
      method: methodName,
      params,
    });

    const tx = await contract[methodName](...params);
    return tx;
  }

  async transferBackToPrivyWallet(
    privyWalletAddress: string
  ): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error("Agent wallet not connected");
    }

    if (!ethers.isAddress(privyWalletAddress)) {
      throw new Error("Invalid Privy wallet address");
    }

    const provider = await this.ensureProvider();
    const balance = await provider.getBalance(this.wallet.address);
    const gasPrice = await provider.getFeeData();
    const gasLimit = 21000n;
    const gasCost = gasLimit * (gasPrice.gasPrice || 0n);

    // Calculate maximum transferable amount after gas
    const transferAmount = balance - gasCost;

    if (transferAmount <= 0n) {
      throw new Error("Insufficient balance to cover gas costs");
    }

    return await this.wallet.sendTransaction({
      to: privyWalletAddress,
      value: transferAmount,
      gasLimit,
    });
  }
}

export const agentKit = new AgentKitService();

// Example usage:
/*
const tx = await agentKit.signContract(
  "0xContractAddress",
  ContractABI,
  "methodName",
  [param1, param2]
);
await tx.wait();
*/

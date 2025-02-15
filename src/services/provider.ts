import { ethers } from "ethers";
import { MANTLE_SEPOLIA } from "@/config/networks";

class ProviderService {
  private provider: ethers.Provider | null = null;

  async getProvider(forceNew: boolean = false): Promise<ethers.Provider> {
    if (!this.provider || forceNew) {
      this.provider = new ethers.JsonRpcProvider(MANTLE_SEPOLIA.rpcUrl, {
        name: MANTLE_SEPOLIA.name,
        chainId: MANTLE_SEPOLIA.id,
        ensAddress: null, // Explicitly disable ENS resolution
      });
    }
    return this.provider;
  }
}

export const providerService = new ProviderService();

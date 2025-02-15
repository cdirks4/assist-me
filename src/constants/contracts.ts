export const FUSIONX_V3_CONTRACTS = {
  FACTORY: "0xf811BF0B2174135Ff1c8E615eB6B678caECa8d61",
  POOL_DEPLOYER: "0xD7427359c552cb797eAc23d2E1D171e8000Ff40b",
  SWAP_ROUTER: "0x8fC0B6585d73C94575555B3970D7A79c5bfc6E36",
  V3_MIGRATOR: "0x216b0bd1DFaDa39a9a43d3C2c2282AdfB0e9211d",
  POSITION_MANAGER: "0x94705da51466F3Bb1E8c1591D71C09c9760f5F59",
  MIXED_ROUTE_QUOTER_V1: "0xce79dBa349C689ac75CC164F069c1b281087737b",
  QUOTER_V2: "0xa4e57d8FD802cc6b1b01218dfF0046fA571241da",
  TICK_LENS: "0x0296e6A2Ad3741a41e996E05250C6d591335FAc7",
  TOKEN_VALIDATOR: "0xc72AB6f7fF3423Cb664Dd5a5822d6F61c4Fc02b2",
  MULTICALL: "0x4F90c9105ABE5e693C883E106fEf9c7EaE3cb4CC",
  SMART_ROUTER: "0xE3a68317a2F1c41E5B2efBCe2951088efB0Cf524",
  MASTERCHEF_V3: "0x9316938Eaa09E71CBB1Bf713212A42beCBa2998F",
  V3_POOL_INIT_CODE_HASH:
    "0x1bce652aaa6528355d7a339037433a20cd28410e3967635ba8d2ddb037440dbf",
} as const;

export const COMMON_BASES = {
  WMNT: "0xc0eeCFA24E391E4259B7EF17be54Be5139DA1AC7", // Updated WMNT address
  USDC: "0x086a532583CdF6d9666c978Fa153B25816488CBb",
} as const;

export const WMNT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function deposit() external payable",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function withdraw(uint256 amount) external",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "receive() external payable",
] as const;

export const POOL_FEES = {
  LOWEST: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
} as const;

// src/constants/abis.ts

export const campaignABI = [
  { inputs: [], name: "campaignStartTime", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignActive", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "campaignScheduled", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" },
] as const;

export const agentABI = [{ inputs: [{ internalType: "address", name: "wallet", type: "address" }], name: "isAgent", outputs: [{ internalType: "bool", name: "", type: "bool" }], stateMutability: "view", type: "function" }] as const;

export const agentGMABI = [{ inputs: [{ internalType: "address", name: "user", type: "address" }], name: "totalUserGM", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" }] as const;

export const badgeABI = [
  { inputs: [], name: "minReputationScore", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "balanceOf", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ internalType: "uint256", name: "score", type: "uint256" }, { internalType: "bytes", name: "signature", type: "bytes" }, { internalType: "uint256", name: "deadline", type: "uint256" }], name: "mint", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ internalType: "address", name: "user", type: "address" }], name: "getNonce", outputs: [{ internalType: "uint256", name: "", type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

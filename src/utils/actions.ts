// src/utils/actions.ts

import { PARTNER_ACTIONS } from "../constants/partnerActions";
import {
  dodABI,
  axdABI,
  rubyscoreABI,
  lootcoinABI,
  presaABI,
  onchainGMABI,
  owltoABI,
  captainABI,
  arkadaABI,
  nekoABI,
  surfABI,
  wheelABI,
  metaABI,
  dmailABI,
  podsABI,
  startaleABI,
  exartaABI,
  zombieABI,
  pocketKnightsABI,
  morningMoonABI,
  coNFTABI,
  harkanABI,
  redButtonABI,
  gmBoostABI,
  openSeaMintABI,
  sweepClaimABI,
} from "../constants/partnerABIs";

// Returnează ABI-ul corect pentru fiecare acțiune
export const getPartnerABI = (actionId: number) => {
  switch (actionId) {
    case 0: return dodABI;
    case 1: return axdABI;
    case 2: return rubyscoreABI;
    case 3: return lootcoinABI;
    case 4: return presaABI;
    case 5: return onchainGMABI;
    case 6: return captainABI;
    case 7: return arkadaABI;
    case 8: return owltoABI;
    case 9: return nekoABI;
    case 10: return surfABI;
    case 11: return wheelABI;
    case 12: return metaABI;
    case 13: return dmailABI;
    case 14: return podsABI;
    case 15: return startaleABI;
    case 16: return exartaABI;
    case 17: return zombieABI;
    case 18: return pocketKnightsABI;
    case 19: return morningMoonABI;
    case 20: return coNFTABI;
    case 21: return harkanABI;
    case 22: return redButtonABI;
    case 23: return gmBoostABI;
    case 24: return openSeaMintABI;
    case 25: return sweepClaimABI;
    default: throw new Error("Unknown action id");
  }
};

// Returnează numele funcției corect pentru fiecare acțiune
export const getPartnerFunctionName = (actionId: number): string => {
  return PARTNER_ACTIONS[actionId].functionName;
};

// Returnează argumentele corecte pentru fiecare acțiune
export const getPartnerArgs = (actionId: number, address?: `0x${string}`): any[] => {
  const zeroAddress = "0x0000000000000000000000000000000000000000" as `0x${string}`;
  
  switch (actionId) {
    case 3: // Lootcoin
    case 5: // OnChain GM
      return [zeroAddress];
    case 8: // Owlto
      const todayDate = new Date();
      const currentDate = BigInt(parseInt(todayDate.getFullYear().toString() + (todayDate.getMonth() + 1).toString().padStart(2, '0') + todayDate.getDate().toString().padStart(2, '0')));
      return [currentDate, BigInt(PARTNER_ACTIONS[8].externalFee)];
    case 9: // NekoKat
      const startDate = new Date(2026, 4, 1);
      const dayNum = BigInt(Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      return ["GMeow", dayNum, BigInt(1)];
    case 12: // MetaMap
      return [1n, "https://gm-agent.xyz/"];
    case 13: // Dmail
      return ["0xe5271cfad1cbf0200337a2dff847239dbd42f8b2a8edec7ada8638d402b3d03d", "0x49f5b25165973e49ca79684733f5645b8fac5ef0e0ce3f3fe0e0742bcc90341f"];
    case 14: // Pods
      return [address || zeroAddress, "https://gm-agent.xyz/"];
    case 16: // Exarta
      return [205970022n, 0n];
    case 17: // ZombieIdle
      return ["bearstudio.zombie.ads", "ETH"];
    case 20: // coNFT
      return ["GM AGENT", "AGENT", "https://gm-agent.xyz/twitter-image.png", 100000n, 0n, "0x3f99231dD03a9F0E7e3421c92B7b90fbe012985a" as `0x${string}`, address || zeroAddress];
    case 21: // Harkan - recordActionWithRandom
      return ["cyber-roulette", "spin", 0n, 1n, 1000n];
    case 22: // Red Button - drawItem
      return [0, 1924992000, "0x"];
    case 24: // OpenSea Mint
      return ["0x1B3D12FE28FB2A80F89ecA7A0C1aE66BD975042d" as `0x${string}`, "0x0000a26b00c1F0DF003000390027140000fAa719" as `0x${string}`, address || zeroAddress, 1n];
    case 25: // GM Sweep
      return [address || zeroAddress, 0n, 1n, "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as `0x${string}`, 30000000000000n, [[], 0n, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, "0x0000000000000000000000000000000000000000" as `0x${string}`], "0x" as `0x${string}`];
    default:
      return [];
  }
};

// Returnează fee-ul corect pentru fiecare acțiune
export const getPartnerFee = (actionId: number): bigint => {
  return BigInt(PARTNER_ACTIONS[actionId].externalFee || 0);
};

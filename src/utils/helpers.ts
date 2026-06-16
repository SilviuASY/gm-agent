// src/utils/helpers.ts

import { keyframes } from "@emotion/react";

// ================= ANIMATIONS =================
export const float = keyframes`
  0% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-8px) scale(1.05); }
  100% { transform: translateY(0px) scale(1); }
`;

export const floatSlow = keyframes`
  0% { transform: translateY(0px) translateX(0px); }
  33% { transform: translateY(-20px) translateX(15px); }
  66% { transform: translateY(15px) translateX(-15px); }
  100% { transform: translateY(0px) translateX(0px); }
`;

export const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); opacity: 0.9; }
  70% { box-shadow: 0 0 0 30px rgba(139, 92, 246, 0); opacity: 1; }
  100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); opacity: 0.9; }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const slideUp = keyframes`
  from { opacity: 0; transform: translateY(40px); filter: blur(8px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
`;

export const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-40px); filter: blur(8px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

export const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(40px); filter: blur(8px); }
  to { opacity: 1; transform: translateX(0); filter: blur(0); }
`;

// ================= HELPER FUNCTIONS =================
export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const formatFee = (fee: bigint) => {
  if (fee === 0n) return "0";
  return (Number(fee) / 1e18).toFixed(6);
};

export const formatTimeRemaining = (seconds: number) => {
  if (seconds <= 0) return "Ready!";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

export const toHexAddress = (addr: string): `0x${string}` => addr as `0x${string}`;

export const getUserBadge = (score: number) => {
  if (score >= 1000) return { label: "LEGEND", icon: "👑", color: "#ffd700", glow: "#ffd70080", bg: "linear(135deg, #ffd70020, #ffd70005)", minScore: 1000 };
  if (score >= 500) return { label: "ELITE", icon: "⚡", color: "#c0c0c0", glow: "#c0c0c080", bg: "linear(135deg, #c0c0c020, #c0c0c005)", minScore: 500 };
  if (score >= 250) return { label: "ACTIVE", icon: "🔥", color: "#ff6b35", glow: "#ff6b3580", bg: "linear(135deg, #ff6b3520, #ff6b3505)", minScore: 250 };
  if (score >= 100) return { label: "RISING", icon: "⭐", color: "#c084fc", glow: "#c084fc80", bg: "linear(135deg, #c084fc20, #c084fc05)", minScore: 100 };
  if (score >= 50) return { label: "BEGINNER", icon: "🌿", color: "#4ade80", glow: "#4ade8080", bg: "linear(135deg, #4ade8020, #4ade8005)", minScore: 50 };
  return { label: "NEW", icon: "✨", color: "#9ca3af", glow: "#9ca3af80", bg: "linear(135deg, #9ca3af20, #9ca3af05)", minScore: 0 };
};

export const getNextTierTarget = (score: number) => {
  if (score < 50) return 50;
  if (score < 100) return 100;
  if (score < 250) return 250;
  if (score < 500) return 500;
  if (score < 1000) return 1000;
  return 1000;
};

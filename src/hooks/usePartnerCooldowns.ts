// src/hooks/usePartnerCooldowns.ts

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { PARTNER_ACTIONS } from "../constants/partnerActions";
import { AGENT_GATEWAY_CONTRACT } from "../constants/contracts";
import { agentGatewayABI } from "../abi/agentGatewayABI";
import { toHexAddress } from "../utils/helpers";

export function usePartnerCooldowns(address?: `0x${string}`, isCorrectChain?: boolean) {
  const cooldownData = PARTNER_ACTIONS.map(action =>
    useReadContract({
      address: toHexAddress(AGENT_GATEWAY_CONTRACT),
      abi: agentGatewayABI,
      functionName: "getRemainingCooldown",
      args: address && isCorrectChain ? [address, BigInt(action.id)] : undefined,
      query: {
        enabled: !!address && !!isCorrectChain,
        refetchInterval: 5000,
      },
    })
  );

  const [cooldownRemaining, setCooldownRemaining] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const newCooldowns: { [key: number]: number } = {};
    PARTNER_ACTIONS.forEach((action, index) => {
      const data = cooldownData[index]?.data;
      if (data !== undefined && data !== null) {
        const remaining = Number(data);
        if (remaining > 0) {
          newCooldowns[action.id] = remaining;
        }
      }
    });
    setCooldownRemaining(prev => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(newCooldowns);
      if (prevStr !== newStr) {
        return newCooldowns;
      }
      return prev;
    });
  }, [cooldownData.map(d => d.dataUpdatedAt).join(',')]);

  const getRemainingCooldown = (actionId: number): number => {
    return cooldownRemaining[actionId] || 0;
  };

  return { getRemainingCooldown };
}

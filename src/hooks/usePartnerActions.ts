// src/hooks/usePartnerActions.ts

import { useState } from "react";
import { useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { PARTNER_ACTIONS } from "../constants/partnerActions";
import { AGENT_GATEWAY_CONTRACT } from "../constants/contracts";
import { agentGatewayABI } from "../abi/agentGatewayABI";
import { toHexAddress } from "../utils/helpers";

export function usePartnerActions(address?: `0x${string}`, isConnected?: boolean, isCorrectChain?: boolean) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isTxPending, setIsTxPending] = useState(false);

  // CITIRE DEFAULT FEE
  const { data: defaultFee = 0n } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "defaultFee",
    query: { enabled: true },
  });

  // CITIRE USER TOTAL ACTIONS
  const { data: userTotalActionsContract = 0n, refetch: refetchTotalActions } = useReadContract({
    address: toHexAddress(AGENT_GATEWAY_CONTRACT),
    abi: agentGatewayABI,
    functionName: "getUserTotalActions",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!isConnected && !!isCorrectChain },
  });

  // CITIRE PARTNER ACTION COUNTS
  const userActionCounts = PARTNER_ACTIONS.map((_, index) =>
    useReadContract({
      address: toHexAddress(AGENT_GATEWAY_CONTRACT),
      abi: agentGatewayABI,
      functionName: "getUserActionCount",
      args: address && isCorrectChain ? [address, BigInt(index)] : undefined,
      query: { enabled: !!address && !!isConnected && !!isCorrectChain },
    })
  );

  const userPartnerTotal = userActionCounts.reduce((sum, count) => sum + Number(count.data || 0n), 0);

  const refetchAll = async () => {
    await Promise.all([
      refetchTotalActions(),
      ...userActionCounts.map(refetch => refetch.refetch()),
    ]);
  };

  return {
    defaultFee,
    userTotalActionsContract,
    userActionCounts,
    userPartnerTotal,
    refetchAll,
    isTxPending,
    setIsTxPending,
    writeContractAsync,
    publicClient,
  };
}

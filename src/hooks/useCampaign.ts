// src/hooks/useCampaign.ts

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { GM_CONTRACT } from "../constants/contracts";
import { campaignABI } from "../constants/abis";
import { toHexAddress } from "../utils/helpers";

export function useCampaign() {
  const [campaignStartTime, setCampaignStartTime] = useState<number>(0);
  const [campaignActive, setCampaignActive] = useState<boolean>(false);
  const [campaignScheduled, setCampaignScheduled] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  const { data: campaignStartTimeData = 0n } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignStartTime",
    query: { enabled: true },
  });

  const { data: campaignActiveData = false } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignActive",
    query: { enabled: true },
  });

  const { data: campaignScheduledData = false } = useReadContract({
    address: toHexAddress(GM_CONTRACT),
    abi: campaignABI,
    functionName: "campaignScheduled",
    query: { enabled: true },
  });

  useEffect(() => {
    if (campaignStartTimeData) setCampaignStartTime(Number(campaignStartTimeData));
    setCampaignActive(campaignActiveData);
    setCampaignScheduled(campaignScheduledData);
  }, [campaignStartTimeData, campaignActiveData, campaignScheduledData]);

  useEffect(() => {
    if (campaignStartTime > 0) {
      const updateTimer = () => {
        const now = Math.floor(Date.now() / 1000);
        const diff = campaignStartTime - now;
        if (diff <= 0) { setTimeRemaining(null); return; }
        const days = Math.floor(diff / 86400);
        const hours = Math.floor((diff % 86400) / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setTimeRemaining({ days, hours, minutes, seconds });
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [campaignStartTime]);

  return {
    campaignStartTime,
    campaignActive,
    campaignScheduled,
    timeRemaining,
    campaignStartTimeData,
    campaignActiveData,
    campaignScheduledData,
  };
}

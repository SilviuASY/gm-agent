// src/hooks/useTransactionModal.ts

import { useState, useCallback } from "react";

type TxStatus = "idle" | "wallet" | "pending" | "success" | "rejected" | "failed";

export function useTransactionModal() {
  const [txOpen, setTxOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txTitle, setTxTitle] = useState("");
  const [txDesc, setTxDesc] = useState("");

  const resetTx = useCallback(() => {
    setTxStatus("idle");
    setTxTitle("");
    setTxDesc("");
  }, []);

  const closeTx = useCallback(() => {
    setTxOpen(false);
    setTimeout(() => {
      if (txStatus === "success" || txStatus === "rejected" || txStatus === "failed") {
        resetTx();
      }
    }, 300);
  }, [txStatus, resetTx]);

  const openTx = useCallback((status: TxStatus, title: string, desc: string) => {
    setTxOpen(true);
    setTxStatus(status);
    setTxTitle(title);
    setTxDesc(desc);
  }, []);

  return {
    txOpen,
    setTxOpen,
    txStatus,
    setTxStatus,
    txTitle,
    setTxTitle,
    txDesc,
    setTxDesc,
    resetTx,
    closeTx,
    openTx,
  };
}

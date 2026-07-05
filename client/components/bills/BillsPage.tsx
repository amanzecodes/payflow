"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import PayBillCard from "./PayBillCard";
import RecentPurchases from "./RecentPurchases";
import { DUMMY_PURCHASES, WALLET_BALANCE } from "./data";
import type { BillPurchase } from "./types";

const BillsPage = () => {
  const [purchases, setPurchases] = useState<BillPurchase[]>(DUMMY_PURCHASES);

  const handlePurchase = (purchase: BillPurchase) => {
    setPurchases((prev) => [purchase, ...prev]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Bills</h1>
        <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
          Airtime, data, and electricity from your wallet.
        </p>
      </div>

      <PayBillCard walletBalance={WALLET_BALANCE} onPurchase={handlePurchase} />

      <RecentPurchases purchases={purchases} />
    </motion.div>
  );
};

export default BillsPage;

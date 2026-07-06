"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import PayBillCard from "./PayBillCard";
import RecentPurchases from "./RecentPurchases";
import { DUMMY_PURCHASES } from "./data";
import type { BillPurchase } from "./types";
import { usePayoutPage } from "@/hooks/payouts/use-payout-page";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

const BillsPage = () => {
  const router = useRouter();
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);

  useEffect(() => {
    if (hasHydrated && !orgId) {
      router.push("/onboarding");
    }
  }, [hasHydrated, orgId, router]);

  const { data: payoutData } = usePayoutPage(orgId!);

  const [purchases, setPurchases] = useState<BillPurchase[]>(DUMMY_PURCHASES);
  const [balanceAdjustment, setBalanceAdjustment] = useState(0);

  const walletBalance = Math.max((payoutData?.balance?.available ?? 0) + balanceAdjustment, 0);

  const handlePurchase = (purchase: BillPurchase) => {
    setPurchases((prev) => [purchase, ...prev]);
  };

  const handleBalanceChange = (delta: number) => {
    setBalanceAdjustment((prev) => prev + delta);
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

      <PayBillCard
        walletBalance={walletBalance}
        orgId={orgId}
        onPurchase={handlePurchase}
        onBalanceChange={handleBalanceChange}
      />

      <RecentPurchases purchases={purchases} />
    </motion.div>
  );
};

export default BillsPage;

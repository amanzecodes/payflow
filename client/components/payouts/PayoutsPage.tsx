"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { usePayoutPage, useRequestPayout } from "@/hooks/payouts/use-payout-page";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { getApiErrorMessage } from "@/lib/api/error";
import RequestPayoutCard from "./RequestPayoutCard";
import ConfirmPayoutModal from "./ConfirmPayoutModal";
import PayoutHistoryTable from "./PayoutHistoryTable";
import type { PayoutRecord } from "./types";

const ZERO_BALANCE = "₦0.00";

const PayoutsPage = () => {
  const router = useRouter();
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balance, setBalance] = useState(ZERO_BALANCE);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    if (hasHydrated && !orgId) {
      router.push("/onboarding");
    }
  }, [hasHydrated, orgId, router]);

  const { data: payoutData, isLoading } = usePayoutPage(orgId!);
  const requestPayout = useRequestPayout(orgId!);

  const payouts: PayoutRecord[] = payoutData?.payouts?.map((payout) => ({
    id: payout.id,
    date: new Date(payout.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    amount: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(payout.amount),
    bank: payout.bankName,
    accountLast4: payout.bankAccount.slice(-4),
    reference: payout.transferRef || "N/A",
    status: payout.status === "COMPLETED" ? "Completed" : payout.status === "PENDING" ? "Pending" : "Failed",
  })) ?? [];

  const availableBalance = payoutData?.balance?.available ?? 0;
  const formattedBalance = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(availableBalance);

  const destinationAccount = payoutData?.payoutDestination
    ? {
        bankName: payoutData.payoutDestination.bankName,
        accountLast4: payoutData.payoutDestination.last4,
      }
    : {
        bankName: "Account",
        accountLast4: "****",
      };

  const handleConfirm = async () => {
    try {
      await requestPayout.mutateAsync(pendingAmount);
      setBalance(ZERO_BALANCE);
      setIsModalOpen(false);
      toast.success("Payout request submitted successfully");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit payout request"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="border-b border-zinc-200 pb-6">
          <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-zinc-100 rounded animate-pulse" />
        </div>

        {/* Request Card Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-zinc-200">
          <div className="space-y-4">
            <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-zinc-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-zinc-200">
          <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Payouts</h1>
        <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
          The money movement record — withdraw your balance and track every transfer out.
        </p>
      </div>

      {/* Request Payout */}
      <RequestPayoutCard
        balance={formattedBalance}
        availableBalance={availableBalance}
        destination={destinationAccount}
        disabled={availableBalance === 0}
        onWithdraw={(amount) => {
          setPendingAmount(amount);
          setBalance(
            new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              minimumFractionDigits: 0,
            }).format(amount)
          );
          setIsModalOpen(true);
        }}
      />

      {/* Payout History */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200">
        <p className="text-base font-bold text-zinc-900 mb-4">Payout History</p>
        <PayoutHistoryTable payouts={payouts} />
      </div>

      <ConfirmPayoutModal
        open={isModalOpen}
        amount={balance}
        destination={destinationAccount}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default PayoutsPage;

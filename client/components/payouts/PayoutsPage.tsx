"use client";

import { useState } from "react";

import { AVAILABLE_BALANCE, DESTINATION_ACCOUNT, MOCK_PAYOUTS } from "./data";
import RequestPayoutCard from "./RequestPayoutCard";
import ConfirmPayoutModal from "./ConfirmPayoutModal";
import PayoutHistoryTable from "./PayoutHistoryTable";
import type { PayoutRecord } from "./types";

const ZERO_BALANCE = "₦0.00";

const PayoutsPage = () => {
  const [balance, setBalance] = useState(AVAILABLE_BALANCE);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(MOCK_PAYOUTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirm = async () => {
    // Simulates the Nomba Transfer API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const payoutId = `PO-${Date.now()}`;
    const newPayout: PayoutRecord = {
      id: payoutId,
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      amount: balance,
      bank: DESTINATION_ACCOUNT.bankName,
      accountLast4: DESTINATION_ACCOUNT.accountLast4,
      reference: `PYT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      status: "Pending",
    };

    setPayouts((prev) => [newPayout, ...prev]);
    setBalance(ZERO_BALANCE);
    setIsModalOpen(false);

    // Mirrors the async settlement webhook flipping the payout to Completed
    setTimeout(() => {
      setPayouts((prev) =>
        prev.map((payout) => (payout.id === payoutId ? { ...payout, status: "Completed" } : payout))
      );
    }, 2200);
  };

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
        balance={balance}
        destination={DESTINATION_ACCOUNT}
        disabled={balance === ZERO_BALANCE}
        onWithdraw={() => setIsModalOpen(true)}
      />

      {/* Payout History */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200">
        <p className="text-base font-bold text-zinc-900 mb-4">Payout History</p>
        <PayoutHistoryTable payouts={payouts} />
      </div>

      <ConfirmPayoutModal
        open={isModalOpen}
        amount={balance}
        destination={DESTINATION_ACCOUNT}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default PayoutsPage;

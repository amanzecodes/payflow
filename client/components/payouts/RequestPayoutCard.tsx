"use client";

import { useState } from "react";
import { HiOutlineArrowUpRight, HiOutlineWallet } from "react-icons/hi2";

import type { PayoutDestination } from "./types";

interface RequestPayoutCardProps {
  balance: string;
  availableBalance: number;
  destination: PayoutDestination;
  disabled: boolean;
  onWithdraw: (amount: number) => void;
}

const RequestPayoutCard = ({
  balance,
  availableBalance,
  destination,
  disabled,
  onWithdraw,
}: RequestPayoutCardProps) => {
  const [amount, setAmount] = useState<number | "">("");

  const isValidAmount = amount !== "" && amount > 0 && amount <= availableBalance;

  return (
    <div className="p-8 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <HiOutlineWallet size={16} />
        Available Balance
      </div>
      <p className="text-4xl font-bold text-zinc-900 mt-3 tracking-tight">{balance}</p>
      <p className="text-sm text-zinc-400 mt-2">Ready for withdrawal right now</p>

      <div className="mt-6 max-w-xs">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Amount to withdraw (₦)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          disabled={disabled}
          placeholder="e.g. 50000"
          min="1"
          max={availableBalance}
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0b79ff]/20 focus:border-[#0b79ff]/40 transition-all disabled:bg-zinc-50 disabled:cursor-not-allowed"
        />
        {amount !== "" && amount > availableBalance && (
          <p className="text-xs text-rose-600 mt-1.5">Amount exceeds available balance</p>
        )}
      </div>

      <button
        onClick={() => isValidAmount && onWithdraw(amount)}
        disabled={disabled || !isValidAmount}
        className="w-full sm:w-auto mt-6 inline-flex items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-6 py-3.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiOutlineArrowUpRight size={18} />
        Withdraw to {destination.bankName} ••{destination.accountLast4}
      </button>
    </div>
  );
};

export default RequestPayoutCard;

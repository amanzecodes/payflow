"use client";

import { HiOutlineArrowUpRight, HiOutlineWallet } from "react-icons/hi2";

import type { PayoutDestination } from "./types";

interface RequestPayoutCardProps {
  balance: string;
  destination: PayoutDestination;
  disabled: boolean;
  onWithdraw: () => void;
}

const RequestPayoutCard = ({ balance, destination, disabled, onWithdraw }: RequestPayoutCardProps) => {
  return (
    <div className="p-8 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <HiOutlineWallet size={16} />
        Available Balance
      </div>
      <p className="text-4xl font-bold text-zinc-900 mt-3 tracking-tight">{balance}</p>
      <p className="text-sm text-zinc-400 mt-2">Ready for withdrawal right now</p>

      <button
        onClick={onWithdraw}
        disabled={disabled}
        className="w-full sm:w-auto mt-7 inline-flex items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-6 py-3.5 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HiOutlineArrowUpRight size={18} />
        Withdraw to {destination.bankName} ••{destination.accountLast4}
      </button>
    </div>
  );
};

export default RequestPayoutCard;

"use client";

import { motion } from "framer-motion";
import { HiOutlineBanknotes } from "react-icons/hi2";

import { STATUS_STYLES } from "./data";
import { rowVariants } from "./animations";
import type { PayoutRecord } from "./types";

interface PayoutHistoryTableProps {
  payouts: PayoutRecord[];
}

const PayoutHistoryTable = ({ payouts }: PayoutHistoryTableProps) => {
  if (payouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
          <HiOutlineBanknotes size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">No payouts yet</p>
          <p className="text-xs text-zinc-400 mt-1">Withdrawals you make will show up here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pl-1">Date</th>
            <th className="pb-3">Amount</th>
            <th className="pb-3">Destination</th>
            <th className="pb-3">Reference</th>
            <th className="pb-3 text-right pr-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout, index) => (
            <motion.tr
              key={payout.id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
            >
              <td className="py-4 pl-1 text-sm text-zinc-600">{payout.date}</td>
              <td className="py-4 text-sm font-bold text-zinc-900">{payout.amount}</td>
              <td className="py-4">
                <p className="text-sm text-zinc-600">{payout.bank}</p>
                <p className="text-xs text-zinc-400 mt-0.5">••{payout.accountLast4}</p>
              </td>
              <td className="py-4 text-sm font-mono text-zinc-500">{payout.reference}</td>
              <td className="py-4 text-right pr-1">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[payout.status]}`}
                >
                  {payout.status}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutHistoryTable;

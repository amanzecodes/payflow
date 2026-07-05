"use client";

import { motion } from "framer-motion";
import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight, HiOutlineArrowUturnLeft, HiOutlineReceiptPercent } from "react-icons/hi2";

import { STATUS_STYLES, TYPE_LABEL, formatDateTime, formatNaira } from "./data";
import { rowVariants } from "./animations";
import type { Transaction } from "./types";

interface TransactionsTableProps {
  transactions: Transaction[];
  onSelect: (transaction: Transaction) => void;
}

const TYPE_ICON: Record<Transaction["type"], typeof HiOutlineArrowDownLeft> = {
  PAYMENT: HiOutlineArrowDownLeft,
  PAYOUT: HiOutlineArrowUpRight,
  REFUND: HiOutlineArrowUturnLeft,
};

const TYPE_ICON_STYLES: Record<Transaction["type"], string> = {
  PAYMENT: "text-emerald-600 bg-emerald-50",
  PAYOUT: "text-zinc-600 bg-zinc-100",
  REFUND: "text-amber-600 bg-amber-50",
};

const TransactionsTable = ({ transactions, onSelect }: TransactionsTableProps) => {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
          <HiOutlineReceiptPercent size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">No transactions match this view</p>
          <p className="text-xs text-zinc-400 mt-1">Try a different filter or search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pl-1 whitespace-nowrap">Transaction</th>
            <th className="pb-3 whitespace-nowrap">Type</th>
            <th className="pb-3 whitespace-nowrap">Method</th>
            <th className="pb-3 whitespace-nowrap">Status</th>
            <th className="pb-3 text-right pr-1 whitespace-nowrap">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((txn, index) => {
            const Icon = TYPE_ICON[txn.type];
            const isCredit = txn.type === "PAYMENT";

            return (
              <motion.tr
                key={txn.id}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
                onClick={() => onSelect(txn)}
                className="group cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
              >
                <td className="py-4 pl-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${TYPE_ICON_STYLES[txn.type]}`}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {txn.counterparty?.name || txn.narration}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">{txn.reference}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-sm text-zinc-600 whitespace-nowrap">{TYPE_LABEL[txn.type]}</td>
                <td className="py-4 text-sm text-zinc-500 whitespace-nowrap">
                  {txn.method}
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(txn.createdAt)}</p>
                </td>
                <td className="py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[txn.status]}`}
                  >
                    {txn.status === "SUCCESS" ? "Success" : txn.status === "PENDING" ? "Pending" : "Failed"}
                  </span>
                </td>
                <td
                  className={`py-4 text-right pr-1 text-sm font-bold whitespace-nowrap ${isCredit ? "text-emerald-600" : "text-zinc-900"}`}
                >
                  {isCredit ? "+" : "-"}
                  {formatNaira(txn.amount)}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;

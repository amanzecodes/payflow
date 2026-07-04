"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight, HiOutlineArrowUturnLeft, HiOutlineCheck, HiOutlineXMark } from "react-icons/hi2";

import { STATUS_STYLES, TYPE_LABEL, formatDateTime, formatNaira } from "./data";
import { backdropVariants, panelVariants } from "./animations";
import CopyButton from "@/components/members/CopyButton";
import type { Transaction } from "./types";

interface TransactionDetailPanelProps {
  transaction: Transaction | null;
  onClose: () => void;
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

const TransactionDetailPanel = ({ transaction, onClose }: TransactionDetailPanelProps) => {
  return (
    <AnimatePresence>
      {transaction && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.aside
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            className="absolute top-0 right-0 h-full w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 ${TYPE_ICON_STYLES[transaction.type]}`}
                >
                  {(() => {
                    const Icon = TYPE_ICON[transaction.type];
                    return <Icon size={18} />;
                  })()}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{TYPE_LABEL[transaction.type]}</p>
                  <p className="text-xs text-zinc-400 font-mono truncate">{transaction.reference}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div className="p-6 space-y-7">
              {/* Amount + Status */}
              <div className="text-center py-4">
                <p
                  className={`text-3xl font-bold tracking-tight ${
                    transaction.type === "PAYMENT" ? "text-emerald-600" : "text-zinc-900"
                  }`}
                >
                  {transaction.type === "PAYMENT" ? "+" : "-"}
                  {formatNaira(transaction.amount)}
                </p>
                <span
                  className={`inline-flex items-center mt-3 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[transaction.status]}`}
                >
                  {transaction.status === "SUCCESS" ? "Success" : transaction.status === "PENDING" ? "Pending" : "Failed"}
                </span>
              </div>

              {/* Narration */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <p className="text-xs text-zinc-400 font-medium mb-1">Narration</p>
                <p className="text-sm font-semibold text-zinc-900">{transaction.narration}</p>
              </div>

              {/* Details */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Details
                </p>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-zinc-400 font-medium mb-1">Reference</p>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-mono font-semibold text-zinc-900">{transaction.reference}</p>
                      <CopyButton value={transaction.reference} />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-zinc-400 font-medium mb-1">Method</p>
                    <p className="text-sm font-semibold text-zinc-900">{transaction.method}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <p className="text-xs text-zinc-400 font-medium mb-1">Date</p>
                    <p className="text-sm font-semibold text-zinc-900">{formatDateTime(transaction.createdAt)}</p>
                  </div>
                  {transaction.counterparty && (
                    <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="text-xs text-zinc-400 font-medium mb-1">Member</p>
                      <p className="text-sm font-semibold text-zinc-900">{transaction.counterparty.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 font-mono">{transaction.counterparty.identifier}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Timeline
                </p>
                <div className="space-y-0">
                  {transaction.timeline.map((event, index) => (
                    <div key={event.label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                            event.done ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {event.done && <HiOutlineCheck size={13} />}
                        </span>
                        {index < transaction.timeline.length - 1 && (
                          <span className={`w-px flex-1 my-1 ${event.done ? "bg-emerald-200" : "bg-zinc-100"}`} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className={`text-sm font-medium ${event.done ? "text-zinc-900" : "text-zinc-400"}`}>
                          {event.label}
                        </p>
                        {event.timestamp && (
                          <p className="text-xs text-zinc-400 mt-0.5">{formatDateTime(event.timestamp)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionDetailPanel;

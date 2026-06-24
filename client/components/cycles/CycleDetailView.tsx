"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowLeft,
  HiOutlineArrowDownTray,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

import { STATUS_STYLES, STATUS_WEIGHT } from "./data";
import { exportCycleToCsv, exportCycleToPdf } from "./export";
import { rowVariants, viewVariants } from "./animations";
import type { Cycle } from "./types";

interface CycleDetailViewProps {
  cycle: Cycle;
  onBack: () => void;
}

const CycleDetailView = ({ cycle, onBack }: CycleDetailViewProps) => {
  const sortedMembers = useMemo(
    () => [...cycle.members].sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]),
    [cycle]
  );

  return (
    <motion.div
      variants={viewVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors mb-3"
          >
            <HiOutlineArrowLeft size={14} />
            All Cycles
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{cycle.period}</h2>
          <p className="text-sm text-zinc-500 mt-1.5">
            Full accountability report — every member&apos;s status for this cycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCycleToCsv(cycle)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold transition-colors"
          >
            <HiOutlineArrowDownTray size={16} />
            Export CSV
          </button>
          <button
            onClick={exportCycleToPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold transition-colors"
          >
            <HiOutlineDocumentText size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-white border border-zinc-200">
          <span className="h-9 w-9 rounded-lg bg-zinc-100 text-zinc-500 flex items-center justify-center">
            <HiOutlineBanknotes size={18} />
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-3">{cycle.totalMembers}</p>
          <p className="text-xs text-zinc-400 mt-1">Members billed</p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-zinc-200">
          <span className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <HiOutlineCheckCircle size={18} />
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-3">{cycle.paidCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Paid</p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-zinc-200">
          <span className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <HiOutlineExclamationTriangle size={18} />
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-3">{cycle.overdueCount}</p>
          <p className="text-xs text-zinc-400 mt-1">Overdue</p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-zinc-200">
          <span className="h-9 w-9 rounded-lg bg-[#0b79ff]/10 text-[#0b79ff] flex items-center justify-center">
            <HiOutlineBanknotes size={18} />
          </span>
          <p className="text-2xl font-bold text-zinc-900 mt-3">{cycle.totalCollected}</p>
          <p className="text-xs text-zinc-400 mt-1">Total collected</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                <th className="pb-3 pl-1">Member</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment Date</th>
                <th className="pb-3 text-right pr-1">Reference</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member, index) => (
                <motion.tr
                  key={member.id}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="py-4 pl-1">
                    <p className="text-sm font-semibold text-zinc-900">{member.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">{member.identifier}</p>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[member.status]}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="py-4 text-sm font-bold text-zinc-900">{member.amount}</td>
                  <td className="py-4 text-sm text-zinc-500">{member.paymentDate ?? "—"}</td>
                  <td className="py-4 text-right pr-1 text-sm font-mono text-zinc-500">
                    {member.reference ?? "—"}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default CycleDetailView;

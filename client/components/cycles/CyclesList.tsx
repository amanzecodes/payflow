"use client";

import { motion } from "framer-motion";
import { HiOutlineArrowRight } from "react-icons/hi2";

import { rowVariants } from "./animations";
import type { Cycle } from "./types";

interface CyclesListProps {
  cycles: Cycle[];
  onView: (cycle: Cycle) => void;
}

const CyclesList = ({ cycles, onView }: CyclesListProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pl-1">Cycle</th>
            <th className="pb-3">Members Billed</th>
            <th className="pb-3">Paid</th>
            <th className="pb-3">Overdue</th>
            <th className="pb-3">Total Collected</th>
            <th className="pb-3 text-right pr-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {cycles.map((cycle, index) => (
            <motion.tr
              key={cycle.id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
              className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
            >
              <td className="py-4 pl-1">
                <p className="text-sm font-semibold text-zinc-900">{cycle.period}</p>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">{cycle.id}</p>
              </td>
              <td className="py-4 text-sm text-zinc-600">{cycle.totalMembers}</td>
              <td className="py-4 text-sm font-semibold text-emerald-600">{cycle.paidCount}</td>
              <td className="py-4 text-sm font-semibold text-rose-600">{cycle.overdueCount}</td>
              <td className="py-4 text-sm font-bold text-zinc-900">{cycle.totalCollected}</td>
              <td className="py-4 text-right pr-1">
                <button
                  onClick={() => onView(cycle)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#0b79ff] border border-[#0b79ff]/20 bg-[#0b79ff]/5 hover:bg-[#0b79ff]/10 transition-colors"
                >
                  View
                  <HiOutlineArrowRight size={13} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CyclesList;

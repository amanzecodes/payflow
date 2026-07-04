"use client";

import { motion } from "framer-motion";
import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight, HiOutlineBanknotes, HiOutlineExclamationTriangle } from "react-icons/hi2";

import { formatNaira } from "./data";
import type { Transaction } from "./types";

interface StatCardsProps {
  transactions: Transaction[];
}

const StatCards = ({ transactions }: StatCardsProps) => {
  const moneyIn = transactions
    .filter((t) => t.type === "PAYMENT" && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);

  const moneyOut = transactions
    .filter((t) => (t.type === "PAYOUT" || t.type === "REFUND") && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const failedCount = transactions.filter((t) => t.status === "FAILED").length;

  const stats = [
    {
      title: "Total Volume",
      value: formatNaira(moneyIn + moneyOut),
      description: `${transactions.length} transactions this period`,
      icon: HiOutlineBanknotes,
      accent: "text-[#0b79ff] bg-[#0b79ff]/10",
    },
    {
      title: "Money In",
      value: formatNaira(moneyIn),
      description: "Successful payments received",
      icon: HiOutlineArrowDownLeft,
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Money Out",
      value: formatNaira(moneyOut),
      description: "Payouts and refunds settled",
      icon: HiOutlineArrowUpRight,
      accent: "text-zinc-600 bg-zinc-100",
    },
    {
      title: "Needs Attention",
      value: `${pendingCount + failedCount}`,
      description: `${pendingCount} pending · ${failedCount} failed`,
      icon: HiOutlineExclamationTriangle,
      accent: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
            className="p-6 rounded-xl bg-white flex flex-col justify-between min-h-36"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wider text-zinc-400">{stat.title}</p>
              <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.accent}`}>
                <Icon size={18} />
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-zinc-900 mt-3 tracking-tight">{stat.value}</h3>
              <p className="text-xs text-zinc-400 mt-2">{stat.description}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default StatCards;

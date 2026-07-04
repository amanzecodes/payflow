"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HiOutlineArrowDownTray } from "react-icons/hi2";

import StatCards from "./StatCards";
import FilterBar from "./FilterBar";
import TransactionsTable from "./TransactionsTable";
import TransactionDetailPanel from "./TransactionDetailPanel";
import { DUMMY_TRANSACTIONS } from "./data";
import type { StatusFilter, Transaction, TypeFilter } from "./types";

const TransactionsPage = () => {
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");
  const [activeType, setActiveType] = useState<TypeFilter>("All");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const statusMap: Record<StatusFilter, string | null> = {
      All: null,
      Success: "SUCCESS",
      Pending: "PENDING",
      Failed: "FAILED",
    };
    const typeMap: Record<TypeFilter, string | null> = {
      All: null,
      Payments: "PAYMENT",
      Payouts: "PAYOUT",
      Refunds: "REFUND",
    };

    return DUMMY_TRANSACTIONS.filter((txn) => {
      const targetStatus = statusMap[activeStatus];
      const targetType = typeMap[activeType];

      return (
        (targetStatus === null || txn.status === targetStatus) &&
        (targetType === null || txn.type === targetType) &&
        (!normalized ||
          txn.reference.toLowerCase().includes(normalized) ||
          txn.narration.toLowerCase().includes(normalized) ||
          txn.counterparty?.name.toLowerCase().includes(normalized))
      );
    });
  }, [search, activeStatus, activeType]);

  const statusCounts = useMemo(
    () => ({
      All: DUMMY_TRANSACTIONS.length,
      Success: DUMMY_TRANSACTIONS.filter((t) => t.status === "SUCCESS").length,
      Pending: DUMMY_TRANSACTIONS.filter((t) => t.status === "PENDING").length,
      Failed: DUMMY_TRANSACTIONS.filter((t) => t.status === "FAILED").length,
    }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Transactions</h1>
          <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
            Every payment, payout, and refund moving through this organisation.
          </p>
        </div>

        <button className="inline-flex items-center justify-center cursor-pointer gap-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-sm px-5 py-3 transition-colors self-start sm:self-auto">
          <HiOutlineArrowDownTray size={18} />
          Export
        </button>
      </div>

      {/* Stat Cards */}
      <StatCards transactions={DUMMY_TRANSACTIONS} />

      {/* Workspace */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          activeType={activeType}
          onTypeChange={setActiveType}
          statusCounts={statusCounts}
        />

        <TransactionsTable transactions={filteredTransactions} onSelect={setSelectedTransaction} />
      </div>

      <TransactionDetailPanel transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </motion.div>
  );
};

export default TransactionsPage;

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HiOutlineArrowDownTray, HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";

import StatCards from "./StatCards";
import FilterBar from "./FilterBar";
import TransactionsTable from "./TransactionsTable";
import TransactionDetailPanel from "./TransactionDetailPanel";
import { toTransaction } from "./data";
import type { StatusFilter, Transaction, TypeFilter } from "./types";
import { useTransactions } from "@/hooks/transactions/use-transactions";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import { getApiErrorMessage } from "@/lib/api/error";

const PAGE_LIMIT = 20;

const TransactionsPage = () => {
  const router = useRouter();
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("All");
  const [activeType, setActiveType] = useState<TypeFilter>("All");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (hasHydrated && !orgId) {
      router.push("/onboarding");
    }
  }, [hasHydrated, orgId, router]);

  const { data, isPending, isFetching, isError, error } = useTransactions(orgId!, page, PAGE_LIMIT);

  const transactions = useMemo(
    () => data?.transactions.map(toTransaction) ?? [],
    [data?.transactions]
  );

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

    return transactions.filter((txn) => {
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
  }, [transactions, search, activeStatus, activeType]);

  const statusCounts: Record<StatusFilter, number> = {
    All: data?.stats.totalCount ?? 0,
    Success: data?.stats.successCount ?? 0,
    Pending: data?.stats.pendingCount ?? 0,
    Failed: data?.stats.failedCount ?? 0,
  };

  const pagination = data?.pagination;

  if (isPending) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="border-b border-zinc-200 pb-6">
          <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-zinc-100 rounded animate-pulse" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-xl border border-zinc-200 animate-pulse" />
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-zinc-200">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="border-b border-zinc-200 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Transactions</h1>
          <p className="text-sm text-red-500 mt-2.5 max-w-xl leading-relaxed">
            {getApiErrorMessage(error, "Failed to load transactions. Please try again.")}
          </p>
        </div>
      </div>
    );
  }

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
      <StatCards stats={data.stats} />

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

        <TransactionsTable
          transactions={filteredTransactions}
          onSelect={setSelectedTransaction}
        />

        {pagination && pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              {isFetching
                ? "Loading…"
                : `Page ${pagination.page} of ${pagination.pages} · ${pagination.total} total`}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <HiOutlineChevronLeft size={14} />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages || isFetching}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <HiOutlineChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionDetailPanel transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </motion.div>
  );
};

export default TransactionsPage;

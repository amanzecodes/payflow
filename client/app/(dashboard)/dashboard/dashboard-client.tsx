"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  HiOutlineArrowDownTray,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineWallet,
  HiOutlineInbox,
} from "react-icons/hi2";
import { PiHandshake } from "react-icons/pi";
import { useDashboardData } from "@/hooks/dashboard/use-dashboard";
import { useOnboardingStore } from "@/lib/store/onboarding.store";
import LiveDashboardListener from "@/components/LiveDashboardListener";
import type {
  PaymentReceivedEvent,
  PaymentOverpaymentEvent,
} from "@/types/socket.types";

interface DashboardStats {
  totalCollected: number;
  outstanding: number;
  overdueCount: number;
  availableBalance: number;
}

const getStats = ({ totalCollected, outstanding, overdueCount, availableBalance }: DashboardStats) => [
  {
    title: "Total Collected This Cycle",
    value: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(totalCollected),
    description: "Sum of all payments landed so far",
    icon: HiOutlineBanknotes,
    accent: "text-[#0b79ff] bg-[#0b79ff]/10",
  },
  {
    title: "Outstanding",
    value: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(outstanding),
    description: "Still unpaid this cycle",
    icon: HiOutlineClock,
    accent: "text-amber-600 bg-amber-50",
  },
  {
    title: "Overdue",
    value: `${overdueCount} Member${overdueCount !== 1 ? "s" : ""}`,
    description: "Missed the due date",
    icon: HiOutlineExclamationTriangle,
    accent: "text-rose-600 bg-rose-50",
  },
  {
    title: "Available Balance",
    value: new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(availableBalance),
    description: "Ready for withdrawal now",
    icon: HiOutlineWallet,
    accent: "text-emerald-600 bg-emerald-50",
  },
];

interface LiveFeedItem {
  id: string;
  memberName: string;
  amount: number;
  createdAt: string;
  isLive?: boolean;
}

type ChargeStatus = "PENDING" | "PAID" | "OVERDUE";

const STATUS_WEIGHT: Record<ChargeStatus, number> = {
  OVERDUE: 0,
  PENDING: 1,
  PAID: 2,
};

const STATUS_STYLES: Record<ChargeStatus, string> = {
  OVERDUE: "bg-rose-50 text-rose-700 border-rose-100",
  PENDING: "bg-amber-50 text-amber-700 border-amber-100",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const getStatusLabel = (status: ChargeStatus): string => {
  const labels: Record<ChargeStatus, string> = {
    OVERDUE: "Overdue",
    PENDING: "Pending",
    PAID: "Paid",
  };
  return labels[status];
};

const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const VISIBLE_COUNT = 5;

export default function DashboardClientPage() {
  const router = useRouter();
  const [showAllMembers, setShowAllMembers] = useState(false);
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);

  const [liveFeedItems, setLiveFeedItems] = useState<LiveFeedItem[]>([]);
  const [statsOverride, setStatsOverride] = useState<{ totalCollected: number; outstanding: number } | null>(
    null
  );

  useEffect(() => {
    if (hasHydrated && !orgId) {
      router.push("/onboarding");
    }
  }, [hasHydrated, orgId, router]);

  const { data: dashboard, isLoading } = useDashboardData(orgId!);

  const pushLiveUpdate = (item: LiveFeedItem, amountCollected: number, amountOwed: number) => {
    setLiveFeedItems((prev) => [item, ...prev]);
    setStatsOverride((prev) => {
      const base = prev ?? {
        totalCollected: dashboard?.data?.currentCycle?.totalCollected || 0,
        outstanding: dashboard?.data?.currentCycle?.outstanding || 0,
      };
      return {
        totalCollected: base.totalCollected + amountCollected,
        outstanding: Math.max(0, base.outstanding - amountOwed),
      };
    });

    
    setTimeout(() => {
      setLiveFeedItems((current) => current.filter((entry) => entry.id !== item.id));
      setStatsOverride(null);
    }, 2500);
  };

  const handlePaymentReceived = (payment: PaymentReceivedEvent) => {
    pushLiveUpdate(
      {
        id: payment.txRef,
        memberName: payment.memberName,
        amount: payment.amount,
        createdAt: payment.paidAt,
        isLive: true,
      },
      payment.amount,
      payment.amount
    );
  };

  const handlePaymentOverpaid = (event: PaymentOverpaymentEvent) => {
    pushLiveUpdate(
      {
        id: `${event.identifier}-${event.timestamp}`,
        memberName: event.memberName,
        amount: event.received,
        createdAt: event.timestamp,
        isLive: true,
      },
      event.received,
      event.expected
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
          <div>
            <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-zinc-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white min-h-36">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                <div className="h-9 w-9 bg-zinc-200 rounded-lg animate-pulse" />
              </div>
              <div className="h-8 w-40 bg-zinc-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-6 rounded-xl bg-white">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 h-11 bg-zinc-200 rounded-lg animate-pulse" />
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-6 rounded-xl bg-white">
              <div className="h-5 w-40 bg-zinc-200 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse mb-2" />
                      <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const charges = (dashboard?.data?.currentCycle?.charges || []).sort(
    (a, b) =>
      STATUS_WEIGHT[a.status as ChargeStatus] -
      STATUS_WEIGHT[b.status as ChargeStatus]
  );

  const visibleCharges = showAllMembers
    ? charges
    : charges.slice(0, VISIBLE_COUNT);

  const recentActivity = dashboard?.data?.recentActivity || [];

  const feedItems: LiveFeedItem[] = [
    ...liveFeedItems,
    ...recentActivity.map((charge) => ({
      id: charge.id,
      memberName: charge.member?.name || "Unknown",
      amount: charge.amount,
      createdAt: charge.createdAt,
    })),
  ].slice(0, VISIBLE_COUNT);

  const stats: DashboardStats = {
    totalCollected: statsOverride?.totalCollected ?? dashboard?.data?.currentCycle?.totalCollected ?? 0,
    outstanding: statsOverride?.outstanding ?? dashboard?.data?.currentCycle?.outstanding ?? 0,
    overdueCount: dashboard?.data?.currentCycle?.overdueCount || 0,
    availableBalance: dashboard?.data?.balance?.available || 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {orgId && (
        <LiveDashboardListener
          orgId={orgId}
          onPaymentReceived={handlePaymentReceived}
          onPaymentUnderpaid={() => {}}
          onPaymentOverpaid={handlePaymentOverpaid}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
            Everything you need to know about this billing cycle, at a glance.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {getStats(stats).map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
              className="p-6 rounded-xl bg-white flex flex-col justify-between min-h-36"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wider text-zinc-400">
                  {stat.title}
                </p>
                <span
                  className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.accent}`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 mt-3 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs text-zinc-400 mt-2">{stat.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-6 rounded-xl bg-white">
        <button
          onClick={() => router.push("/payout")}
          className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm"
        >
          <HiOutlineWallet size={18} />
          Request Payout
        </button>
        <button
          onClick={() => router.push("/members?action=add")}
          className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm"
        >
          <PiHandshake size={18} />
          Add Member
        </button>
        <button className="flex-1 inline-flex items-center justify-center gap-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg py-3.5 transition-colors">
          <HiOutlineArrowDownTray size={18} />
          Download Report
        </button>
      </div>

      {/* Primary Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left: Current Cycle Status */}
        <div className="p-6 rounded-xl bg-white">
          <div className="mb-4">
            <h3 className="text-base font-bold text-zinc-900">
              Current Cycle Status
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5">
              Overdue members surfaced first
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {visibleCharges.length > 0 ? (
              visibleCharges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex items-center justify-between min-h-14"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {charge.member?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                      {charge.member?.identifier || "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-bold text-zinc-900">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      }).format(charge.amount)}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[charge.status as ChargeStatus]}`}
                    >
                      {getStatusLabel(charge.status as ChargeStatus)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-3">
                  <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center">
                    <HiOutlineInbox size={32} className="text-zinc-400" />
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-900">
                  No charges yet
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Charges will appear here once members are added
                </p>
              </div>
            )}
          </div>

          {charges.length > VISIBLE_COUNT && (
            <button
              onClick={() => setShowAllMembers((prev) => !prev)}
              className="w-full mt-4 pt-4 border-t border-zinc-100 text-sm font-medium text-[#0b79ff] hover:text-[#0066de] transition-colors"
            >
              {showAllMembers ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Right: Live Activity Feed */}
        <div className="p-6 rounded-xl bg-white">
          <div className="mb-4">
            <h3 className="text-base font-bold text-zinc-900">
              Live Activity Feed
            </h3>
            <p className="text-xs text-zinc-400 mt-1.5">
              Newest payment events land at the top
            </p>
          </div>

          <div className="divide-y divide-zinc-100">
            {feedItems.length > 0 ? (
              feedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={item.isLive ? { backgroundColor: "rgba(16,185,129,0.18)" } : false}
                  animate={{ backgroundColor: "rgba(16,185,129,0)" }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  className="flex items-center justify-between min-h-14 rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {item.memberName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <span className="text-sm font-bold text-zinc-900">
                      {new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      }).format(item.amount)}
                    </span>
                    <span className="text-xs text-zinc-400 w-20">
                      {item.isLive ? "Just now" : formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-3">
                  <div className="h-16 w-16 rounded-full bg-zinc-100 flex items-center justify-center">
                    <HiOutlineClock size={32} className="text-zinc-400" />
                  </div>
                </div>
                <p className="text-sm font-medium text-zinc-900">
                  No activity yet
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Payment events will appear here as they arrive
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowPath,
  HiOutlineBanknotes,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineWallet,
} from "react-icons/hi2";
import { PiHandshake } from "react-icons/pi";

const STATS = [
  {
    title: "Total Collected This Cycle",
    value: "₦1,420,500.00",
    description: "Sum of all payments landed so far",
    icon: HiOutlineBanknotes,
    accent: "text-[#0b79ff] bg-[#0b79ff]/10",
  },
  {
    title: "Outstanding",
    value: "₦480,000.00",
    description: "Still unpaid this cycle",
    icon: HiOutlineClock,
    accent: "text-amber-600 bg-amber-50",
  },
  {
    title: "Overdue",
    value: "3 Members",
    description: "Missed the due date",
    icon: HiOutlineExclamationTriangle,
    accent: "text-rose-600 bg-rose-50",
  },
  {
    title: "Available Balance",
    value: "₦940,000.00",
    description: "Ready for withdrawal now",
    icon: HiOutlineWallet,
    accent: "text-emerald-600 bg-emerald-50",
  },
];

type MemberStatus = "Overdue" | "Pending" | "Paid";

interface Member {
  id: string;
  name: string;
  identifier: string;
  amount: string;
  status: MemberStatus;
}

const STATUS_WEIGHT: Record<MemberStatus, number> = {
  Overdue: 0,
  Pending: 1,
  Paid: 2,
};

const MEMBERS: Member[] = [
  {
    id: "M-001",
    name: "Tunde Bakare",
    identifier: "MEM-0192",
    amount: "₦10,000.00",
    status: "Overdue",
  },
  {
    id: "M-002",
    name: "Chidinma Okeke",
    identifier: "MEM-0177",
    amount: "₦15,000.00",
    status: "Overdue",
  },
  {
    id: "M-003",
    name: "Yusuf Aliyu",
    identifier: "MEM-0145",
    amount: "₦20,000.00",
    status: "Overdue",
  },
  {
    id: "M-004",
    name: "Amaka Eze",
    identifier: "MEM-0210",
    amount: "₦10,000.00",
    status: "Pending",
  },
  {
    id: "M-005",
    name: "Femi Adewale",
    identifier: "MEM-0098",
    amount: "₦25,000.00",
    status: "Pending",
  },
  {
    id: "M-006",
    name: "Grace Obi",
    identifier: "MEM-0233",
    amount: "₦10,000.00",
    status: "Paid",
  },
  {
    id: "M-007",
    name: "Ibrahim Musa",
    identifier: "MEM-0061",
    amount: "₦30,000.00",
    status: "Paid",
  },
  {
    id: "M-008",
    name: "Ngozi Umeh",
    identifier: "MEM-0184",
    amount: "₦10,000.00",
    status: "Paid",
  },
];

MEMBERS.sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]);

const STATUS_STYLES: Record<MemberStatus, string> = {
  Overdue: "bg-rose-50 text-rose-700 border-rose-100",
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

interface ActivityEvent {
  id: string;
  name: string;
  amount: string;
  time: string;
}

// TODO: replace with live Socket.io stream — new events should unshift onto this list as they arrive
const ACTIVITY_FEED: ActivityEvent[] = [
  { id: "A-1", name: "Grace Obi", amount: "₦10,000.00", time: "Just now" },
  { id: "A-2", name: "Ibrahim Musa", amount: "₦30,000.00", time: "8 mins ago" },
  { id: "A-3", name: "Ngozi Umeh", amount: "₦10,000.00", time: "22 mins ago" },
  { id: "A-4", name: "Femi Adewale", amount: "₦25,000.00", time: "1 hr ago" },
  { id: "A-5", name: "Amaka Eze", amount: "₦10,000.00", time: "3 hrs ago" },
];

const VISIBLE_COUNT = 5;

const DashboardPage = () => {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const visibleMembers = showAllMembers
    ? MEMBERS
    : MEMBERS.slice(0, VISIBLE_COUNT);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: re-fetch latest activity from the Socket.io stream
    setTimeout(() => setIsRefreshing(false), 600);
  };

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
        {STATS.map((stat, i) => {
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
        <button className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm">
          <HiOutlineWallet size={18} />
          Request Payout
        </button>
        <button className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm">
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
            {visibleMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between min-h-14"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                    {member.identifier}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-bold text-zinc-900">
                    {member.amount}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[member.status]}`}
                  >
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {MEMBERS.length > VISIBLE_COUNT && (
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
            {ACTIVITY_FEED.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between min-h-14"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" /> */}
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    {event.name}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span className="text-sm font-bold text-zinc-900">
                    {event.amount}
                  </span>
                  <span className="text-xs text-zinc-400 w-20">
                    {event.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            className="w-full mt-4 pt-4 border-t border-zinc-100 flex items-center justify-center gap-2 text-sm font-medium text-[#0b79ff] hover:text-[#0066de] transition-colors"
          >
            <HiOutlineArrowPath
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;

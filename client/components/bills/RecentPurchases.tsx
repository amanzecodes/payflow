"use client";

import { motion } from "framer-motion";
import { HiOutlineBolt, HiOutlineDevicePhoneMobile, HiOutlineReceiptPercent, HiOutlineWifi } from "react-icons/hi2";

import { STATUS_LABEL, STATUS_STYLES, formatNaira, formatRelativeTime } from "./data";
import type { BillPurchase, BillTab } from "./types";

interface RecentPurchasesProps {
  purchases: BillPurchase[];
}

const TYPE_ICON: Record<BillTab, typeof HiOutlineBolt> = {
  AIRTIME: HiOutlineDevicePhoneMobile,
  DATA: HiOutlineWifi,
  ELECTRICITY: HiOutlineBolt,
};

const TYPE_LABEL: Record<BillTab, string> = {
  AIRTIME: "Airtime",
  DATA: "Data",
  ELECTRICITY: "Electricity",
};

const RecentPurchases = ({ purchases }: RecentPurchasesProps) => {
  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <p className="text-base font-bold text-zinc-900">Recent purchases</p>
      <p className="text-sm text-zinc-500 mt-1">The last few airtime, data, and power runs from your wallet.</p>

      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
            <HiOutlineReceiptPercent size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">No purchases yet</p>
            <p className="text-xs text-zinc-400 mt-1">Your airtime, data, and electricity buys will show up here</p>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {purchases.map((purchase, index) => {
            const Icon = TYPE_ICON[purchase.type];

            return (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.2) }}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg bg-zinc-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {TYPE_LABEL[purchase.type]} · {purchase.provider}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {purchase.identifier} · {formatRelativeTime(purchase.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-900">{formatNaira(purchase.amount)}</p>
                  <span
                    className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[purchase.status]}`}
                  >
                    {STATUS_LABEL[purchase.status]}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentPurchases;

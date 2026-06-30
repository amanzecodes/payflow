"use client";

import { motion } from "framer-motion";
import { HiOutlineUserPlus } from "react-icons/hi2";

import { CHARGE_STATUS_DOT, CHARGE_STATUS_STYLES, getChargeStatusDisplay } from "./data";
import { rowVariants } from "./animations";
import type { MemberWithChargeStatus } from "@/lib/api/member.api";

interface MembersTableProps {
  members: MemberWithChargeStatus[];
  onSelect: (member: MemberWithChargeStatus) => void;
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MembersTable = ({ members, onSelect }: MembersTableProps) => {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
          <HiOutlineUserPlus size={22} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">No members match this view</p>
          <p className="text-xs text-zinc-400 mt-1">Try a different filter or search term</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
            <th className="pb-3 pl-1">Member</th>
            <th className="pb-3">Expected Amount</th>
            <th className="pb-3">Virtual Account</th>
            <th className="pb-3">Status</th>
            <th className="pb-3 text-right pr-1">Last Payment</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <motion.tr
              key={member.id}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2) }}
              onClick={() => onSelect(member)}
              className="group cursor-pointer border-b border-zinc-100 last:border-0 hover:bg-zinc-50/70 transition-colors"
            >
              <td className="py-4 pl-1">
                <div className="flex items-center gap-3">
                  <span className="relative h-9 w-9 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                    {initialsOf(member.name)}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${member.currentChargeStatus ? CHARGE_STATUS_DOT[member.currentChargeStatus] : "bg-zinc-400"}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{member.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 font-mono">{member.identifier}</p>
                  </div>
                </div>
              </td>
              <td className="py-4 text-sm text-zinc-600">₦{member.expectedAmount.toLocaleString()}</td>
              <td className="py-4">
                <p className="text-sm font-mono text-zinc-600">{member.vaNumber}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{member.vaBankName}</p>
              </td>
              <td className="py-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${member.currentChargeStatus ? CHARGE_STATUS_STYLES[member.currentChargeStatus] : "bg-zinc-50 text-zinc-700 border-zinc-100"}`}
                >
                  {getChargeStatusDisplay(member.currentChargeStatus)}
                </span>
              </td>
              <td className="py-4 text-right pr-1 text-sm text-zinc-500">
                {member.lastPaidAt ? new Date(member.lastPaidAt).toLocaleDateString() : "-"}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MembersTable;

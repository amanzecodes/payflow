"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineExclamationTriangle, HiOutlineXMark } from "react-icons/hi2";

import { STATUS_STYLES } from "./data";
import { backdropVariants, panelVariants } from "./animations";
import CopyButton from "./CopyButton";
import type { Member } from "./types";

interface MemberDetailPanelProps {
  member: Member | null;
  onClose: () => void;
  onDeactivate: (memberId: string) => void;
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MemberDetailPanel = ({ member, onClose, onDeactivate }: MemberDetailPanelProps) => {
  const [confirmingDeactivate, setConfirmingDeactivate] = useState(false);

  const handleClose = () => {
    setConfirmingDeactivate(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm"
          onClick={handleClose}
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
                <span className="h-11 w-11 rounded-full bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">
                  {initialsOf(member.name)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 truncate">{member.name}</p>
                  <p className="text-xs text-zinc-400 font-mono">{member.identifier}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div className="p-6 space-y-7">
              {/* Status + Plan */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_STYLES[member.status]}`}
                >
                  {member.status}
                </span>
                <span className="text-sm font-semibold text-zinc-900">{member.plan}</span>
              </div>

              {/* Dedicated Account */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Dedicated Account
                </p>
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-mono font-semibold text-zinc-900">{member.accountNumber}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{member.bank}</p>
                  </div>
                  <CopyButton value={member.accountNumber} />
                </div>
              </div>

              {/* Fee Lines */}
              {member.feeLines && member.feeLines.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                    Enrolled Fee Lines
                  </p>
                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
                    {member.feeLines.map((line) => (
                      <div key={line.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <span className="text-zinc-600">{line.label}</span>
                        <span className="font-semibold text-zinc-900">{line.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment History */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                  Payment History
                </p>
                <div className="space-y-2">
                  {member.paymentHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{record.cycle}</p>
                        <p className="text-xs text-zinc-400 mt-0.5 font-mono">{record.reference}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">{record.amount}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{record.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deactivate */}
              <div className="pt-2 border-t border-zinc-100">
                {confirmingDeactivate ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 space-y-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-rose-700">
                      <HiOutlineExclamationTriangle size={16} />
                      Remove {member.name} from future cycles?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDeactivate(member.id)}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
                      >
                        Confirm Deactivate
                      </button>
                      <button
                        onClick={() => setConfirmingDeactivate(false)}
                        className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg py-2.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingDeactivate(true)}
                    className="w-full text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg py-2.5 transition-colors"
                  >
                    Deactivate Member
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MemberDetailPanel;

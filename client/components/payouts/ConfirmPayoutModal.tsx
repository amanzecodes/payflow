"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineBuildingLibrary, HiOutlineXMark } from "react-icons/hi2";

import { backdropVariants, modalVariants } from "./animations";
import type { PayoutDestination } from "./types";

interface ConfirmPayoutModalProps {
  open: boolean;
  amount: string;
  destination: PayoutDestination;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const ConfirmPayoutModal = ({ open, amount, destination, onClose, onConfirm }: ConfirmPayoutModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => !isSubmitting && onClose()}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <p className="text-sm font-bold text-zinc-900">Confirm Payout</p>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors disabled:opacity-40"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-center py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Amount</p>
                <p className="text-3xl font-bold text-zinc-900 mt-2 tracking-tight">{amount}</p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="h-9 w-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                  <HiOutlineBuildingLibrary size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{destination.bankName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Account ending in {destination.accountLast4}</p>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                This will initiate a transfer via the Nomba Transfer API. Funds typically settle within a few
                minutes.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3 transition-colors shadow-sm disabled:opacity-70"
                >
                  {isSubmitting ? "Processing…" : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmPayoutModal;

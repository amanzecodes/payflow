"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi2";

import { backdropVariants, modalVariants } from "@/components/payouts/animations";
import { formatNaira } from "./data";

interface AirtimeSuccessModalProps {
  open: boolean;
  amount: number;
  network: string;
  phoneNumber: string;
  reference: string;
  onDone: () => void;
}

const NETWORK_LABEL: Record<string, string> = {
  MTN: "MTN",
  AIRTEL: "Airtel",
  GLO: "Glo",
  "9MOBILE": "9mobile",
};

const AirtimeSuccessModal = ({ open, amount, network, phoneNumber, reference, onDone }: AirtimeSuccessModalProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center px-4"
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
            <div className="p-6 flex flex-col items-center text-center">
              <span className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <HiOutlineCheckCircle size={32} />
              </span>
              <p className="text-base font-bold text-zinc-900 mt-4 leading-relaxed">
                {formatNaira(amount)} {NETWORK_LABEL[network] ?? network} airtime sent to {phoneNumber}
              </p>
              <p className="text-xs text-zinc-400 mt-2">Reference: {reference}</p>

              <button
                type="button"
                onClick={onDone}
                className="w-full mt-6 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AirtimeSuccessModal;

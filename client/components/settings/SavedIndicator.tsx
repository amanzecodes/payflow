"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi2";

interface SavedIndicatorProps {
  show: boolean;
}

const SavedIndicator = ({ show }: SavedIndicatorProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600"
        >
          <HiOutlineCheckCircle size={14} />
          Saved
        </motion.span>
      )}
    </AnimatePresence>
  );
};

export default SavedIndicator;

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { MOCK_CYCLES } from "./data";
import { viewVariants } from "./animations";
import CyclesList from "./CyclesList";
import CycleDetailView from "./CycleDetailView";
import type { Cycle } from "./types";

const CyclesPage = () => {
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);

  return (
    <AnimatePresence mode="wait">
      {selectedCycle ? (
        <CycleDetailView
          key="detail"
          cycle={selectedCycle}
          onBack={() => setSelectedCycle(null)}
        />
      ) : (
        <motion.div
          key="list"
          variants={viewVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Top Header */}
          <div className="border-b border-zinc-200 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Cycles</h1>
            <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
              The full billing history — every cycle this organisation has run, most recent first.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-zinc-200">
            <CyclesList cycles={MOCK_CYCLES} onView={setSelectedCycle} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CyclesPage;

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineBanknotes, HiOutlineXMark } from "react-icons/hi2";

import { backdropVariants, panelVariants } from "./animations";
import type { MemberWithChargeStatus } from "@/lib/api/member.api";

interface AddMemberPanelProps {
  open: boolean;
  onClose: () => void;
  onCreate: (member: MemberWithChargeStatus) => void;
}

const AddMemberPanel = ({ open, onClose, onCreate }: AddMemberPanelProps) => {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [planAmount, setPlanAmount] = useState("");

  const resetAndClose = () => {
    setName("");
    setIdentifier("");
    setPlanAmount("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !identifier.trim() || !planAmount.trim()) return;

    const newMember: MemberWithChargeStatus = {
      id: `M-${Date.now()}`,
      name: name.trim(),
      identifier: identifier.trim(),
      orgId: "",
      phone: null,
      vaNumber: "Provisioning…",
      vaBankName: "Nomba MFB",
      accountRef: "Provisioning…",
      expectedAmount: parseFloat(planAmount.trim().replace(/,/g, "")),
      status: "Pending",
      accountSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentChargeStatus: "PENDING",
      lastPaidAt: null,
    };

    onCreate(newMember);
    resetAndClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm"
          onClick={resetAndClose}
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
            <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-zinc-100">
              <div>
                <p className="text-sm font-bold text-zinc-900">Add Member</p>
                <p className="text-xs text-zinc-400 mt-0.5">Enroll a new member into this cycle</p>
              </div>
              <button
                onClick={resetAndClose}
                className="h-8 w-8 rounded-full flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors shrink-0"
              >
                <HiOutlineXMark size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Full Name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Bisi Adeyemi"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Identifier
                </label>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="e.g. Flat 3B or Member ID"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Plan Amount Per Cycle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₦</span>
                  <input
                    value={planAmount}
                    onChange={(event) => setPlanAmount(event.target.value)}
                    placeholder="10,000.00"
                    required
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0b79ff]/5 border border-[#0b79ff]/10">
                <HiOutlineBanknotes size={18} className="text-[#0b79ff] shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600 leading-relaxed">
                  A dedicated Nomba account will be automatically provisioned for this member once created.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors shadow-sm"
              >
                Create Member
              </button>
            </form>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddMemberPanel;

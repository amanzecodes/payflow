"use client";

import { useState } from "react";
import { HiOutlineBuildingLibrary, HiOutlineExclamationTriangle } from "react-icons/hi2";

import SavedIndicator from "./SavedIndicator";
import type { PayoutAccountSettings } from "./types";

type Stage = "idle" | "editing" | "confirming";

interface PayoutAccountPanelProps {
  account: PayoutAccountSettings;
  onSave: (account: PayoutAccountSettings) => void;
}

const PayoutAccountPanel = ({ account, onSave }: PayoutAccountPanelProps) => {
  const [stage, setStage] = useState<Stage>("idle");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  const startChange = () => {
    setBankName("");
    setAccountNumber("");
    setStage("editing");
  };

  const handleContinue = () => {
    if (!bankName.trim() || accountNumber.trim().length < 4) return;
    setStage("confirming");
  };

  const handleConfirm = () => {
    onSave({ bankName: bankName.trim(), accountLast4: accountNumber.trim().slice(-4) });
    setStage("idle");
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Payout Account</h2>
          <p className="text-xs text-zinc-400 mt-1">Where your payouts are sent</p>
        </div>
        <SavedIndicator show={justSaved} />
      </div>

      {stage === "idle" && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
              <HiOutlineBuildingLibrary size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">{account.bankName}</p>
              <p className="text-xs text-zinc-400 mt-0.5">Account ending in {account.accountLast4}</p>
            </div>
          </div>
          <button
            onClick={startChange}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-white text-zinc-700 transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {stage === "editing" && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Bank Name
            </label>
            <input
              value={bankName}
              onChange={(event) => setBankName(event.target.value)}
              placeholder="e.g. Access Bank"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Account Number
            </label>
            <input
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              placeholder="0123456789"
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleContinue}
              className="bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Continue
            </button>
            <button
              onClick={() => setStage("idle")}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {stage === "confirming" && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <HiOutlineExclamationTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Confirm these details are correct. Future payouts will be sent to this account.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <p className="text-sm font-semibold text-zinc-900">{bankName}</p>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              ••••{accountNumber.slice(-4)}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Confirm &amp; Save
            </button>
            <button
              onClick={() => setStage("editing")}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutAccountPanel;

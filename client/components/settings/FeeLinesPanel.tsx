"use client";

import { useState } from "react";
import { HiOutlineInformationCircle, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";

import { NEXT_CYCLE_NOTE } from "./data";
import type { FeeLine } from "./types";

interface FeeLinesPanelProps {
  feeLines: FeeLine[];
  onChange: (feeLines: FeeLine[]) => void;
}

const FeeLinesPanel = ({ feeLines, onChange }: FeeLinesPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const startEdit = (line: FeeLine) => {
    setEditingId(line.id);
    setDraftLabel(line.label);
    setDraftAmount(line.amount);
  };

  const saveEdit = () => {
    onChange(
      feeLines.map((line) =>
        line.id === editingId ? { ...line, label: draftLabel, amount: draftAmount } : line
      )
    );
    setEditingId(null);
  };

  const toggleActive = (id: string) => {
    onChange(feeLines.map((line) => (line.id === id ? { ...line, active: !line.active } : line)));
  };

  const removeLine = (id: string) => {
    onChange(feeLines.filter((line) => line.id !== id));
  };

  const addLine = () => {
    if (!draftLabel.trim() || !draftAmount.trim()) return;
    onChange([
      ...feeLines,
      { id: `FL-${Date.now()}`, label: draftLabel.trim(), amount: draftAmount.trim(), active: true },
    ]);
    setDraftLabel("");
    setDraftAmount("");
    setIsAdding(false);
  };

  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Fee Lines</h2>
          <p className="text-xs text-zinc-400 mt-1">Break this collection down into individual fee lines</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setDraftLabel("");
              setDraftAmount("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0b79ff] hover:bg-[#0066de] text-white transition-colors"
          >
            <HiOutlinePlus size={16} />
            Add Fee Line
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
        <HiOutlineInformationCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">{NEXT_CYCLE_NOTE}</p>
      </div>

      <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden">
        {feeLines.map((line) =>
          editingId === line.id ? (
            <div key={line.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-50">
              <input
                value={draftLabel}
                onChange={(event) => setDraftLabel(event.target.value)}
                placeholder="Fee line label"
                className="flex-1 px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
              />
              <input
                value={draftAmount}
                onChange={(event) => setDraftAmount(event.target.value)}
                placeholder="Amount"
                className="w-full sm:w-36 px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0b79ff] hover:bg-[#0066de] text-white transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-white text-zinc-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={line.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${line.active ? "text-zinc-900" : "text-zinc-400 line-through"}`}>
                  {line.label}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">₦{line.amount}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!line.active && (
                  <span className="text-xs font-medium text-zinc-400 px-2 py-1 rounded-full bg-zinc-100">
                    Inactive
                  </span>
                )}
                <button
                  onClick={() => startEdit(line)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(line.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors"
                >
                  {line.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => removeLine(line.id)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <HiOutlineTrash size={15} />
                </button>
              </div>
            </div>
          )
        )}

        {isAdding && (
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-zinc-50">
            <input
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder="Fee line label"
              autoFocus
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
            <input
              value={draftAmount}
              onChange={(event) => setDraftAmount(event.target.value)}
              placeholder="Amount"
              className="w-full sm:w-36 px-3.5 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={addLine}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0b79ff] hover:bg-[#0066de] text-white transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-white text-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeLinesPanel;

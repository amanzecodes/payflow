"use client";

import { useState } from "react";
import { HiOutlineInformationCircle } from "react-icons/hi2";

import { FREQUENCY_OPTIONS, NEXT_CYCLE_NOTE } from "./data";
import SavedIndicator from "./SavedIndicator";
import type { CollectionSettings } from "./types";

interface CollectionPanelProps {
  collection: CollectionSettings;
  onSave: (collection: CollectionSettings) => void;
}

const CollectionPanel = ({ collection, onSave }: CollectionPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(collection.name);
  const [amount, setAmount] = useState(collection.amountPerCycle);
  const [frequency, setFrequency] = useState(collection.frequency);
  const [justSaved, setJustSaved] = useState(false);

  const handleEdit = () => {
    setName(collection.name);
    setAmount(collection.amountPerCycle);
    setFrequency(collection.frequency);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setName(collection.name);
    setAmount(collection.amountPerCycle);
    setFrequency(collection.frequency);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave({ name, amountPerCycle: amount, frequency });
    setIsEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  return (
    <div className="p-6 rounded-xl bg-white border border-zinc-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-zinc-900">Collection</h2>
          <p className="text-xs text-zinc-400 mt-1">What members are billed, and how often</p>
        </div>
        <div className="flex items-center gap-3">
          <SavedIndicator show={justSaved} />
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
        <HiOutlineInformationCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">{NEXT_CYCLE_NOTE}</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Collection Name
          </label>
          {isEditing ? (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
            />
          ) : (
            <p className="text-sm font-semibold text-zinc-900">{collection.name}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Amount Per Cycle
            </label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">₦</span>
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
                />
              </div>
            ) : (
              <p className="text-sm font-semibold text-zinc-900">₦{collection.amountPerCycle}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Billing Frequency
            </label>
            {isEditing ? (
              <select
                value={frequency}
                onChange={(event) => setFrequency(event.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm text-zinc-900 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-semibold text-zinc-900">{collection.frequency}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionPanel;

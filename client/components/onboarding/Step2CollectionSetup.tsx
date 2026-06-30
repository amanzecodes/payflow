"use client";

import { useState } from "react";
import type { CycleFrequency, FeeLine, Structure } from "@/types/onboarding.types";
import { useCreateCollection, useCreateFeeLine, useDeleteFeeLine } from "@/hooks/onboarding/use-onboarding-mutations";
import { getApiErrorMessage } from "@/lib/api/error";
import { CustomSelect } from "./CustomSelect";

const CYCLES: CycleFrequency[] = ["MONTHLY", "QUARTERLY", "YEARLY", "TERMLY", "ONE_TIME"];

interface Step2Props {
  orgId: string;
  structure: Structure;
  onNext: (collectionId: string, name: string, cycle: string, amount?: number, feeLines?: FeeLine[]) => void;
}

export function Step2CollectionSetup({ orgId, structure, onNext }: Step2Props) {
  const [name, setName] = useState("");
  const [cycle, setCycle] = useState<CycleFrequency>("MONTHLY");
  const [amount, setAmount] = useState<number | "">("");
  const [feeLines, setFeeLines] = useState<FeeLine[]>([]);
  const [feeLineName, setFeeLineName] = useState("");
  const [feeLineAmount, setFeeLineAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const createCollection = useCreateCollection();
  const createFeeLine = useCreateFeeLine();
  const deleteFeeLine = useDeleteFeeLine();

  const handleAddFeeLine = async () => {
    setError(null);
    if (!feeLineName.trim() || feeLineAmount === "") {
      setError("Fee line name and amount required");
      return;
    }

    try {
      // Create collection first if not exists
      let collectionId = (createCollection.data as any)?.id;
      if (!collectionId) {
        const col = await createCollection.mutateAsync({
          orgId,
          payload: { name: name || "Default", cycle },
        });
        collectionId = col.id;
      }

      const newFeeLine = await createFeeLine.mutateAsync({
        collectionId,
        name: feeLineName,
        amount: Number(feeLineAmount),
      });

      setFeeLines([...feeLines, newFeeLine]);
      setFeeLineName("");
      setFeeLineAmount("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add fee line"));
    }
  };

  const handleRemoveFeeLine = async (id: string) => {
    try {
      await deleteFeeLine.mutateAsync(id);
      setFeeLines(feeLines.filter((f) => f.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove fee line"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Collection name is required");
      return;
    }

    if (structure === "FLAT" && amount === "") {
      setError("Amount is required");
      return;
    }

    if (structure === "VARIABLE" && feeLines.length === 0) {
      setError("Add at least one fee line");
      return;
    }

    try {
      const collection = await createCollection.mutateAsync({
        orgId,
        payload: {
          name,
          cycle,
          ...(structure === "FLAT" && { amount }),
        },
      });

      onNext(collection.id, name, cycle, structure === "FLAT" ? Number(amount) : undefined, feeLines);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create collection"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Collection Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Collection Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
          placeholder="e.g. Quarterly Levies"
        />
      </div>

      {/* Collection Cycle */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Collection Cycle <span className="text-red-500">*</span>
        </label>
        <CustomSelect
          value={cycle}
          onChange={(value) => setCycle(value as CycleFrequency)}
          options={CYCLES.map((c) => ({ label: c, value: c }))}
          placeholder="Select collection cycle"
        />
      </div>

      {structure === "FLAT" ? (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Amount per Member (₦) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
            placeholder="e.g. 50000"
            min="1"
          />
        </div>
      ) : (
        <div className="pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 mt-6">Add Fee Lines</h3>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={feeLineName}
              onChange={(e) => setFeeLineName(e.target.value)}
              placeholder="Fee line name (e.g. Service charge)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={feeLineAmount}
                onChange={(e) => setFeeLineAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Amount (₦)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
                min="1"
              />
              <button
                type="button"
                onClick={handleAddFeeLine}
                disabled={createFeeLine.isPending}
                className="px-6 py-2.5 bg-[#0b79ff] text-white font-medium rounded-lg hover:bg-[#0066de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {createFeeLine.isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </div>

          {/* Fee Lines List */}
          {feeLines.length > 0 && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Added Fee Lines</p>
              <div className="space-y-2">
                {feeLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{line.name}</p>
                      <p className="text-sm text-gray-600">₦{line.amount.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeeLine(line.id)}
                      disabled={deleteFeeLine.isPending}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createCollection.isPending}
        className="w-full px-4 py-3 bg-[#0b79ff] text-white font-semibold rounded-lg hover:bg-[#0066de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        {createCollection.isPending ? "Creating Collection..." : "Continue to Add Members"}
      </button>
    </form>
  );
}

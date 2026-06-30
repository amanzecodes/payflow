"use client";

import { useState } from "react";
import type { Bank, OrgType, Structure } from "@/types/onboarding.types";
import {
  useBanksList,
  useVerifyBankAccount,
  useCreateOrganisation,
} from "@/hooks/onboarding/use-onboarding-mutations";
import { getApiErrorMessage } from "@/lib/api/error";
import { CustomSelect } from "./CustomSelect";

const ORG_TYPES: OrgType[] = ["ESTATE", "COOPERATIVE", "GYM", "SCHOOL", "CLINIC", "OTHER"];
const STRUCTURES: Structure[] = ["FLAT", "VARIABLE"];

interface Step1Props {
  onNext: (orgId: string, data: any) => void;
}

export function Step1OrganisationDetails({ onNext }: Step1Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("ESTATE");
  const [structure, setStructure] = useState<Structure>("FLAT");
  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const banks = useBanksList();
  const verifyBank = useVerifyBankAccount();
  const createOrg = useCreateOrganisation();

  const handleVerifyAccount = async () => {
    setError(null);
    if (!bankCode || !accountNumber) {
      setError("Please select bank and enter account number");
      return;
    }

    try {
      const result = await verifyBank.mutateAsync({ accountNumber, bankCode });
      setAccountName(result.accountName);
    } catch (err) {
      setError(getApiErrorMessage(err, "Account verification failed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Organisation name is required");
    if (!adminWhatsapp.trim()) return setError("WhatsApp number is required");
    if (!bankCode || !accountNumber || !accountName) {
      return setError("Please verify bank account first");
    }

    const selectedBank = banks.data?.find((b) => b.code === bankCode);
    if (!selectedBank) return setError("Invalid bank selected");

    try {
      const org = await createOrg.mutateAsync({
        name,
        type,
        structure,
        adminWhatsapp,
        payoutBankAccount: accountNumber,
        payoutBankCode: bankCode,
        payoutAccountName: accountName,
        payoutBankName: selectedBank.name,
      });
      onNext(org.id, { name, type, structure });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create organisation"));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Organisation Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Organisation Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
          placeholder="e.g. Sunrise Estate"
        />
      </div>

      {/* Organisation Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Organisation Type <span className="text-red-500">*</span>
        </label>
        <CustomSelect
          value={type}
          onChange={(value) => setType(value as OrgType)}
          options={ORG_TYPES.map((t) => ({ label: t, value: t }))}
          placeholder="Select organisation type"
        />
      </div>

      {/* Collection Structure */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Collection Structure <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2.5">
          {STRUCTURES.map((s) => (
            <label
              key={s}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="radio"
                name="structure"
                value={s}
                checked={structure === s}
                onChange={(e) => setStructure(e.target.value as Structure)}
                className="w-4 h-4 accent-[#0b79ff]"
              />
              <span className="text-sm font-medium text-gray-700">
                {s === "FLAT" ? "Flat Amount (same for all)" : "Variable (different per member)"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Admin WhatsApp Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Admin WhatsApp Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={adminWhatsapp}
          onChange={(e) => setAdminWhatsapp(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
          placeholder="e.g. +2348012345678"
        />
      </div>

      {/* Payout Bank Account Section */}
      <div className="pt-2 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 mt-6">Payout Bank Account</h3>

        <div className="space-y-4">
          {/* Bank Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select Bank <span className="text-red-500">*</span>
            </label>
            <CustomSelect
              value={bankCode}
              onChange={setBankCode}
              options={banks.data?.map((bank) => ({ label: bank.name, value: bank.code })) || []}
              placeholder="Select a bank"
              isLoading={banks.isLoading}
              disabled={banks.isLoading}
            />
          </div>

          {/* Account Number with Verify */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.slice(0, 10))}
                maxLength={10}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
                placeholder="10-digit account"
              />
              <button
                type="button"
                onClick={handleVerifyAccount}
                disabled={verifyBank.isPending || !bankCode || !accountNumber}
                className="px-5 py-2.5 bg-[#0b79ff] text-white font-medium rounded-lg hover:bg-[#0066de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {verifyBank.isPending ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>

          {/* Success Message */}
          {accountName && (
            <div className="p-3.5 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">✓ Account Name: {accountName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createOrg.isPending}
        className="w-full px-4 py-3 bg-[#0b79ff] text-white font-semibold rounded-lg hover:bg-[#0066de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        {createOrg.isPending ? "Creating Organisation..." : "Continue to Collection Setup"}
      </button>
    </form>
  );
}

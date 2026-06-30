"use client";

import { useState, useEffect } from "react";
import type { OrgType, Structure, Member } from "@/types/onboarding.types";
import { useAddMember, useGetInviteCode } from "@/hooks/onboarding/use-onboarding-mutations";
import { getApiErrorMessage } from "@/lib/api/error";

const IDENTIFIER_LABELS: Record<OrgType, string> = {
  ESTATE: "Flat/Unit",
  COOPERATIVE: "Member ID",
  GYM: "Member Name",
  SCHOOL: "Student Name",
  CLINIC: "Patient ID",
  OTHER: "Identifier",
};

interface Step3Props {
  orgId: string;
  orgType: OrgType;
  structure: Structure;
  collectionAmount?: number;
  onNext: () => void;
}

export function Step3AddMembers({ orgId, orgType, structure, collectionAmount, onNext }: Step3Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);

  const addMember = useAddMember();
  const inviteCode = useGetInviteCode(structure === "VARIABLE" ? orgId : undefined);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !identifier.trim()) {
      setError("Name and identifier are required");
      return;
    }

    try {
      const member = await addMember.mutateAsync({
        orgId,
        payload: {
          name,
          identifier,
          expectedAmount: collectionAmount || 0,
        },
      });

      setMembers([...members, member]);
      setName("");
      setIdentifier("");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add member"));
    }
  };

  const handleCopyInviteCode = () => {
    if (inviteCode.data?.inviteCode) {
      navigator.clipboard.writeText(inviteCode.data.inviteCode);
      alert("Invite code copied!");
    }
  };

  const handleCopyAccountDetails = (member: Member) => {
    const details =
      `Name: ${member.name}\n` +
      `Identifier: ${member.identifier}\n` +
      `Bank: ${member.vaBankName}\n` +
      `Account: ${member.vaNumber}\n` +
      `Amount: ₦${member.expectedAmount.toLocaleString()}`;
    navigator.clipboard.writeText(details);
    alert("Account details copied!");
  };

  if (structure === "VARIABLE") {
    return (
      <div className="space-y-7">
        <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Share Your Invite Code</h3>
          <p className="text-sm text-gray-700 mb-4 leading-relaxed">
            Share this code with your members. They text it to your PayFlow WhatsApp number to register and get their dedicated account.
          </p>

          {inviteCode.isLoading ? (
            <p className="text-sm text-gray-600">Loading invite code...</p>
          ) : inviteCode.data?.inviteCode ? (
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-blue-300">
              <code className="flex-1 font-mono text-2xl font-bold text-[#0b79ff] tracking-wider">
                {inviteCode.data.inviteCode}
              </code>
              <button
                type="button"
                onClick={handleCopyInviteCode}
                className="px-5 py-2.5 text-sm bg-[#0b79ff] text-white rounded-lg font-medium hover:bg-[#0066de] transition-colors whitespace-nowrap"
              >
                Copy Code
              </button>
            </div>
          ) : (
            <p className="text-sm text-red-600 font-medium">Failed to load invite code</p>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={onNext}
          className="w-full px-4 py-3 bg-[#0b79ff] text-white font-semibold rounded-lg hover:bg-[#0066de] transition-colors mt-8"
        >
          Done, Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Add Member Form */}
      <form onSubmit={handleAddMember} className="space-y-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900">Add Team Member</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Member Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {IDENTIFIER_LABELS[orgType]} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0b79ff] focus:border-transparent transition-all"
            placeholder={`Enter ${IDENTIFIER_LABELS[orgType].toLowerCase()}`}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={addMember.isPending}
          className="w-full px-4 py-2.5 bg-[#0b79ff] text-white font-medium rounded-lg hover:bg-[#0066de] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addMember.isPending ? "Adding Member..." : "Add Member"}
        </button>
      </form>

      {/* Members List */}
      {members.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">
            Team Members <span className="text-gray-500 font-normal">({members.length})</span>
          </h3>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{IDENTIFIER_LABELS[orgType]}: {member.identifier}</p>
                    <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Bank:</span> {member.vaBankName}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Account:</span> {member.vaNumber}
                      </p>
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Amount:</span> ₦{member.expectedAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyAccountDetails(member)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Copy Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={onNext}
        className="w-full px-4 py-3 bg-[#0b79ff] text-white font-semibold rounded-lg hover:bg-[#0066de] transition-colors mt-8"
      >
        Done, Go to Dashboard
      </button>
    </div>
  );
}

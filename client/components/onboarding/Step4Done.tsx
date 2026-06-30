"use client";

import { useRouter } from "next/navigation";
import type { Structure } from "@/types/onboarding.types";

interface Step4Props {
  orgId: string;
  orgName: string;
  collectionName: string;
  collectionCycle: string;
  structure: Structure;
  memberCount?: number;
  inviteCode?: string;
}

export function Step4Done({
  orgId,
  orgName,
  collectionName,
  collectionCycle,
  structure,
  memberCount,
  inviteCode,
}: Step4Props) {
  const router = useRouter();

  return (
    <div className="space-y-8 text-center">
      {/* Success Header */}
      <div className="space-y-3 py-4">
        <div className="text-6xl animate-bounce inline-block">✓</div>
        <h2 className="text-3xl font-bold text-gray-900">All Set!</h2>
        <p className="text-gray-600 text-lg">Your onboarding is complete and ready to go</p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-6 space-y-5 text-left">
        {/* Organisation */}
        <div className="pb-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Organisation</p>
          <p className="text-lg font-semibold text-gray-900">{orgName}</p>
        </div>

        {/* Collection */}
        <div className="pb-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Collection</p>
          <p className="text-lg font-semibold text-gray-900">
            {collectionName}
          </p>
          <p className="text-sm text-gray-600 mt-1">Cycle: <span className="font-medium text-gray-900">{collectionCycle}</span></p>
        </div>

        {/* Members or Invite Code */}
        {structure === "FLAT" && memberCount !== undefined && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Team Members</p>
            <p className="text-lg font-semibold text-gray-900">{memberCount} member{memberCount !== 1 ? 's' : ''} added</p>
          </div>
        )}

        {structure === "VARIABLE" && inviteCode && (
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Invite Code</p>
            <p className="font-mono text-2xl font-bold text-[#0b79ff] tracking-wider break-all">{inviteCode}</p>
          </div>
        )}
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600 px-4">
        You can add more members and manage your collections from the dashboard anytime.
      </p>

      {/* CTA Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="w-full px-4 py-3.5 bg-[#0b79ff] text-white font-semibold rounded-lg hover:bg-[#0066de] transition-colors shadow-sm mt-6"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

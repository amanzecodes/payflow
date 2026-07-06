"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PiHandshake } from "react-icons/pi";
import FilterBar from "./FilterBar";
import MembersTable from "./MembersTable";
import MemberDetailPanel from "./MemberDetailPanel";
import AddMemberPanel from "./AddMemberPanel";
import type { StatusFilter } from "./types";
import type { MemberWithChargeStatus } from "@/lib/api/member.api";
import { useMembers } from "@/hooks/members/use-member";
import { useOrganisation, useCollections } from "@/hooks/members/use-organisation-setup";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

const MembersPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);
  const { data: fetchedMembers = [], isLoading, error } = useMembers(orgId || "");

  const orgQuery = useOrganisation(orgId);
  const collectionsQuery = useCollections(orgId);
  const org = orgQuery.data;
  const expectedAmount = collectionsQuery.data?.[0]?.amount ?? 0;
  const setupLoading = orgQuery.isLoading || collectionsQuery.isLoading;
  const setupError = orgQuery.isError || collectionsQuery.isError;
  const canAddMember = !!org && (org.structure !== "FLAT" || expectedAmount > 0);

  const handleRetrySetup = () => {
    orgQuery.refetch();
    collectionsQuery.refetch();
  };

  const handleMemberCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["members", orgId] });
  };

  const [members, setMembers] = useState<MemberWithChargeStatus[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [selectedMember, setSelectedMember] = useState<MemberWithChargeStatus | null>(null);
  
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(() => searchParams.get("action") === "add");

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      router.replace("/members", { scroll: false });
    }
  }, [searchParams, router]);


  const [syncedMembers, setSyncedMembers] = useState<MemberWithChargeStatus[] | undefined>();
  if (fetchedMembers.length > 0 && fetchedMembers !== syncedMembers) {
    setSyncedMembers(fetchedMembers);
    setMembers(fetchedMembers);
  }

  const filteredMembers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const filterMap: Record<StatusFilter, string | null> = {
      All: null,
      Overdue: "OVERDUE",
      Pending: "PENDING",
      Paid: "PAID",
    };

    return members
      .filter((member) => {
        const targetStatus = filterMap[activeFilter];
        return targetStatus === null || member.currentChargeStatus === targetStatus;
      })
      .filter(
        (member) =>
          !normalized ||
          member.name.toLowerCase().includes(normalized) ||
          member.identifier.toLowerCase().includes(normalized)
      )
      .sort((a, b) => {
        const statusOrder = { OVERDUE: 0, PENDING: 1, PAID: 2, null: 3 };
        const aOrder = statusOrder[a.currentChargeStatus as keyof typeof statusOrder] ?? 3;
        const bOrder = statusOrder[b.currentChargeStatus as keyof typeof statusOrder] ?? 3;
        return aOrder - bOrder;
      });
  }, [members, search, activeFilter]);

  const counts = useMemo(
    () => ({
      All: members.length,
      Overdue: members.filter((member) => member.currentChargeStatus === "OVERDUE").length,
      Pending: members.filter((member) => member.currentChargeStatus === "PENDING").length,
      Paid: members.filter((member) => member.currentChargeStatus === "PAID").length,
    }),
    [members]
  );

  const handleDeactivate = (memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setSelectedMember(null);
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
          <div className="flex-1">
            <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-zinc-100 rounded animate-pulse" />
          </div>
          <div className="h-11 w-32 bg-zinc-200 rounded animate-pulse shrink-0" />
        </div>

        {/* Workspace Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-6">
          {/* Filter Bar Skeleton */}
          <div className="space-y-4">
            <div className="h-10 w-full bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-24 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="space-y-3">
            {/* Table Headers */}
            <div className="flex gap-4 px-4 py-3 border-b border-zinc-100">
              <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
            </div>

            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4 border-b border-zinc-100 last:border-0">
                <div className="flex-1">
                  <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
                <div className="h-6 w-16 bg-zinc-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Members</h1>
            <p className="text-sm text-red-500 mt-2.5 max-w-xl leading-relaxed">
              Error loading members. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Members</h1>
          <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
            The full roster — search, filter, and manage everyone enrolled in this cycle.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsAddPanelOpen(true)}
            disabled={setupLoading || setupError || !canAddMember}
            title={
              !setupLoading && !setupError && !canAddMember
                ? "Set up a collection amount before adding members"
                : undefined
            }
            className="inline-flex items-center justify-center cursor-pointer gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-sm px-5 py-3 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PiHandshake size={18} />
            Add Member
          </button>
          {setupError && (
            <button
              onClick={handleRetrySetup}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 underline underline-offset-2"
            >
              Couldn&apos;t load setup — Retry
            </button>
          )}
        </div>
      </div>

      {/* Workspace */}
      <div className="p-6 rounded-xl bg-white border border-zinc-200 space-y-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />

        <MembersTable members={filteredMembers} onSelect={setSelectedMember} />
      </div>

      <MemberDetailPanel
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
        onDeactivate={handleDeactivate}
      />

      {org && (
        <AddMemberPanel
          open={isAddPanelOpen}
          onClose={() => setIsAddPanelOpen(false)}
          orgId={orgId || ""}
          orgType={org.type}
          structure={org.structure}
          expectedAmount={expectedAmount}
          inviteCode={org.inviteCode}
          onMemberCreated={handleMemberCreated}
        />
      )}
    </div>
  );
};

export default MembersPage;

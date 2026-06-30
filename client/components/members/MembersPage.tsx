"use client";

import { useMemo, useState, useEffect } from "react";
import { PiHandshake } from "react-icons/pi";
import FilterBar from "./FilterBar";
import MembersTable from "./MembersTable";
import MemberDetailPanel from "./MemberDetailPanel";
import AddMemberPanel from "./AddMemberPanel";
import type { Member, StatusFilter } from "./types";
import type { MemberWithChargeStatus } from "@/lib/api/member.api";
import { useMembers } from "@/hooks/members/use-member";
import { useOnboardingStore } from "@/lib/store/onboarding.store";

const MembersPage = () => {
  const orgId = useOnboardingStore((state) => state.orgId);
  const hasHydrated = useOnboardingStore((state) => state._hasHydrated);
  const { data: fetchedMembers = [], isLoading, error } = useMembers(orgId || "");

  const [members, setMembers] = useState<MemberWithChargeStatus[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [selectedMember, setSelectedMember] = useState<MemberWithChargeStatus | null>(null);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  useEffect(() => {
    if (fetchedMembers.length > 0) {
      setMembers(fetchedMembers);
    }
  }, [fetchedMembers]);

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

  const handleCreate = (member: MemberWithChargeStatus) => {
    setMembers((prev) => [member, ...prev]);
  };

  if (!hasHydrated || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Members</h1>
            <p className="text-sm text-zinc-500 mt-2.5 max-w-xl leading-relaxed">
              Loading members...
            </p>
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

        <button
          onClick={() => setIsAddPanelOpen(true)}
          className="inline-flex items-center justify-center cursor-pointer gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-sm px-5 py-3 transition-colors shadow-sm self-start sm:self-auto"
        >
          <PiHandshake size={18} />
          Add Member
        </button>
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

      <AddMemberPanel
        open={isAddPanelOpen}
        onClose={() => setIsAddPanelOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
};

export default MembersPage;

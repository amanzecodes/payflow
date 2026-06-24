"use client";

import { useMemo, useState } from "react";
import { HiOutlineUserPlus } from "react-icons/hi2";

import { MOCK_MEMBERS, STATUS_WEIGHT } from "./data";
import FilterBar from "./FilterBar";
import MembersTable from "./MembersTable";
import MemberDetailPanel from "./MemberDetailPanel";
import AddMemberPanel from "./AddMemberPanel";
import type { Member, StatusFilter } from "./types";

const MembersPage = () => {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("All");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return members
      .filter((member) => activeFilter === "All" || member.status === activeFilter)
      .filter(
        (member) =>
          !normalized ||
          member.name.toLowerCase().includes(normalized) ||
          member.identifier.toLowerCase().includes(normalized)
      )
      .sort((a, b) => STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status]);
  }, [members, search, activeFilter]);

  const counts = useMemo(
    () => ({
      All: members.length,
      Overdue: members.filter((member) => member.status === "Overdue").length,
      Pending: members.filter((member) => member.status === "Pending").length,
      Paid: members.filter((member) => member.status === "Paid").length,
    }),
    [members]
  );

  const handleDeactivate = (memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
    setSelectedMember(null);
  };

  const handleCreate = (member: Member) => {
    setMembers((prev) => [member, ...prev]);
  };

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
          className="inline-flex items-center justify-center gap-2 bg-[#0b79ff] hover:bg-[#0066de] text-white text-sm font-semibold rounded-lg px-5 py-3 transition-colors shadow-sm self-start sm:self-auto"
        >
          <HiOutlineUserPlus size={18} />
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

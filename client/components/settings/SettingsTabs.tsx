"use client";

import { TAB_DEFS } from "./data";
import type { OrgType, SettingsTab } from "./types";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  orgType: OrgType;
}

const SettingsTabs = ({ activeTab, onTabChange, orgType }: SettingsTabsProps) => {
  const visibleTabs = TAB_DEFS.filter((tab) => tab.id !== "fee-lines" || orgType === "Flow B");

  return (
    <nav className="space-y-2">
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${
              isActive ? "bg-[#0b79ff]/5 text-[#0b79ff]" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <Icon size={18} className={isActive ? "text-[#0b79ff]" : "text-zinc-400"} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
};

export default SettingsTabs;

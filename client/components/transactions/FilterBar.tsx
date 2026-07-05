"use client";

import { motion } from "framer-motion";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { STATUS_FILTERS, TYPE_FILTERS } from "./data";
import type { StatusFilter, TypeFilter } from "./types";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeStatus: StatusFilter;
  onStatusChange: (filter: StatusFilter) => void;
  activeType: TypeFilter;
  onTypeChange: (filter: TypeFilter) => void;
  statusCounts: Record<StatusFilter, number>;
}

const FilterBar = ({
  search,
  onSearchChange,
  activeStatus,
  onStatusChange,
  activeType,
  onTypeChange,
  statusCounts,
}: FilterBarProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <HiOutlineMagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search reference or name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-100 max-w-full overflow-x-auto self-start sm:self-auto">
          {STATUS_FILTERS.map((filter) => {
            const isActive = activeStatus === filter;

            return (
              <button
                key={filter}
                onClick={() => onStatusChange(filter)}
                className="relative shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                {isActive && (
                  <motion.span
                    layoutId="active-txn-status-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>
                  {filter} <span className="text-zinc-400">{statusCounts[filter]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {TYPE_FILTERS.map((filter) => {
          const isActive = activeType === filter;

          return (
            <button
              key={filter}
              onClick={() => onTypeChange(filter)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#0b79ff]/5 text-[#0b79ff] border-[#0b79ff]/20"
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;

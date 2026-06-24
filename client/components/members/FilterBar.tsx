"use client";

import { motion } from "framer-motion";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { STATUS_FILTERS } from "./data";
import type { StatusFilter } from "./types";

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: StatusFilter;
  onFilterChange: (filter: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
}

const FilterBar = ({ search, onSearchChange, activeFilter, onFilterChange, counts }: FilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="relative w-full sm:max-w-xs">
        <HiOutlineMagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name or identifier..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-[#0b79ff]/40 focus:ring-2 focus:ring-[#0b79ff]/10 transition-all"
        />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-100 self-start sm:self-auto">
        {STATUS_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className="relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="active-status-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? "text-zinc-900" : "text-zinc-500"}`}>
                {filter} <span className="text-zinc-400">{counts[filter]}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FilterBar;

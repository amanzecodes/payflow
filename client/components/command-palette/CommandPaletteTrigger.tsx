"use client";

import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

interface CommandPaletteTriggerProps {
  onClick: () => void;
}

const CommandPaletteTrigger = ({ onClick }: CommandPaletteTriggerProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full max-w-xs px-4 py-2.5 rounded-full bg-zinc-100 border border-zinc-200 text-sm text-zinc-500 hover:bg-zinc-200/60 transition-colors"
    >
      <HiOutlineMagnifyingGlass size={16} className="text-zinc-400" />
      <span className="flex-1 text-left truncate">Search transactions, customers...</span>
      <kbd className="px-1.5 py-0.5 rounded-md bg-white border border-zinc-200 text-[11px] font-semibold text-zinc-500">
        Ctrl K
      </kbd>
    </button>
  );
};

export default CommandPaletteTrigger;

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

import { COMMAND_GROUPS } from "./data";
import { backdropVariants, panelVariants } from "./animations";
import type { CommandItem } from "./types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const CommandPalette = ({ open, onClose }: CommandPaletteProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return COMMAND_GROUPS;

    return COMMAND_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.name.toLowerCase().includes(normalized)),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  const flatItems = useMemo(
    () => filteredGroups.flatMap((group) => group.items),
    [filteredGroups]
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);
  };

  const closeAndReset = () => {
    setQuery("");
    setActiveIndex(0);
    onClose();
  };

  const navigateTo = (item: CommandItem) => {
    router.push(item.href);
    closeAndReset();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeAndReset();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % Math.max(flatItems.length, 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % Math.max(flatItems.length, 1));
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selected = flatItems[activeIndex];
      if (selected) navigateTo(selected);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-start justify-center pt-28 px-4"
          onClick={closeAndReset}
        >
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.15 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white border border-zinc-200 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100">
              <HiOutlineMagnifyingGlass size={18} className="text-zinc-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jump to a page or section..."
                className="flex-1 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
              />
              <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[11px] font-semibold text-zinc-500">
                esc
              </kbd>
            </div>

            <div className="max-h-[28rem] overflow-y-auto py-2">
              {flatItems.length === 0 && (
                <p className="px-5 py-6 text-sm text-zinc-400 text-center">No matches found</p>
              )}

              {filteredGroups.map((group) => (
                <div key={group.label} className="px-2 py-2">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {group.label}
                  </p>
                  {group.items.map((item) => {
                    const itemIndex = flatItems.findIndex((flatItem) => flatItem.href === item.href);
                    const Icon = item.icon;
                    const isActive = itemIndex === activeIndex;

                    return (
                      <button
                        key={item.href}
                        onMouseEnter={() => setActiveIndex(itemIndex)}
                        onClick={() => navigateTo(item)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive ? "bg-[#0b79ff]/10 text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500">
                            <Icon size={15} />
                          </span>
                          {item.name}
                        </span>
                        <span className="text-xs text-zinc-400">{item.href}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 text-xs text-zinc-400">
              <span>
                <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-semibold">Ctrl</kbd>{" "}
                <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-semibold">K</kbd> to
                toggle
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 font-semibold">↵</kbd> to
                open
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;

"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiChevronDown, HiOutlineArrowRightOnRectangle, HiOutlineUserCircle } from "react-icons/hi2";

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-zinc-100 transition-colors"
      >
        <span className="h-7 w-7 rounded-full bg-[#0b79ff] text-white text-xs font-semibold flex items-center justify-center">
          AD
        </span>
        <span className="text-sm font-medium text-zinc-700">Adaeze</span>
        <HiChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white border border-zinc-200 shadow-lg overflow-hidden z-50"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100">
              <span className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center shrink-0">
                <HiOutlineUserCircle size={22} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">Adaeze</p>
                <p className="text-xs text-zinc-400 truncate">Worker</p>
              </div>
            </div>

            <button
              onClick={() => {
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              <HiOutlineArrowRightOnRectangle size={16} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;

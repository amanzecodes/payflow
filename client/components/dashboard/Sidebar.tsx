"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineArrowsRightLeft,
  HiOutlineBars3,
  HiOutlineXMark,
  HiChevronUpDown,
  HiOutlineCheck,
} from "react-icons/hi2";

import CommandPalette from "@/components/command-palette/CommandPalette";
import CommandPaletteTrigger from "@/components/command-palette/CommandPaletteTrigger";
import { useCommandPalette } from "@/components/command-palette/useCommandPalette";
import ProfileMenu from "@/components/dashboard/ProfileMenu";

interface SidebarProps {
  children: React.ReactNode;
}

const NAVIGATION_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: HiOutlineSquares2X2 },
  { name: "Members", href: "/members", icon: HiOutlineUserGroup },
  { name: "Transactions", href: "/transactions", icon: HiOutlineArrowsRightLeft },
  { name: "Payouts", href: "/payout", icon: HiOutlineBanknotes },
  // { name: "Settings", href: "/settings", icon: HiOutlineCog6Tooth },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const { open, close, toggle } = useCommandPalette();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/40"
          />
        )}
      </AnimatePresence>

      {/* Structural Sidebar Panel */}
      <motion.aside
        initial={false}
        animate={isDesktop ? "open" : sidebarOpen ? "open" : "closed"}
        variants={{
          open: { x: 0 },
          closed: { x: "-100%" },
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed lg:static inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white flex flex-col justify-between px-4 py-10"
      >
        <div>
          {/* Organisation Selector */}
          <div ref={orgMenuRef} className="relative mb-14">
            <button
              onClick={() => setOrgMenuOpen((prev) => !prev)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
            >
              <span className="h-7 w-7 rounded-lg bg-[#0b79ff] text-white text-xs font-bold flex items-center justify-center shrink-0">
                P
              </span>
              <span className="font-bold text-lg tracking-tight text-zinc-900 truncate">
                Payflet
              </span>
              <HiChevronUpDown
                size={16}
                className="text-zinc-400 ml-auto shrink-0"
              />
            </button>

            <AnimatePresence>
              {orgMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 top-full mt-2 w-full min-w-[14rem] rounded-sm bg-white border border-zinc-200 shadow-sm overflow-hidden z-50"
                >
                  <div className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100">
                    Payflet
                  </div>
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-6 w-6 rounded-md bg-[#0b79ff] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        P
                      </span>
                      <span className="text-sm font-medium text-zinc-900 truncate">
                        Payflet
                      </span>
                    </div>
                    <HiOutlineCheck size={16} className="text-[#0b79ff] shrink-0" />
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setOrgMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors border-t border-zinc-100"
                  >
                    Manage Payflet
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 px-3.5 py-3.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? "bg-[#0b79ff]/5 text-[#0b79ff]"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-colors duration-150 ${
                      isActive ? "text-[#0b79ff]" : "text-zinc-400 group-hover:text-zinc-600"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

      </motion.aside>

      {/* Main Production Workspace */}
      <main className="flex-1 bg-zinc-50 overflow-y-auto min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8 lg:px-14 pt-6 pb-2">
          <div className="lg:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <HiOutlineXMark size={24} className="text-zinc-600" />
              ) : (
                <HiOutlineBars3 size={24} className="text-zinc-600" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 ml-auto">
            <div className="hidden sm:block">
              <CommandPaletteTrigger onClick={toggle} />
            </div>
            <ProfileMenu />
          </div>
        </div>

        <div className="px-4 sm:px-8 lg:px-14 pt-4 pb-10 lg:pb-14 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <CommandPalette open={open} onClose={close} />
    </div>
  );
};

export default Sidebar;

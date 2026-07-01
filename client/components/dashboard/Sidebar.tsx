"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineCog6Tooth,
  HiOutlineBars3,
  HiOutlineXMark,
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
  { name: "Payouts", href: "/payout", icon: HiOutlineBanknotes },
  // { name: "Settings", href: "/settings", icon: HiOutlineCog6Tooth },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const { open, close, toggle } = useCommandPalette();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
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
          {/* Brand/Logo Area */}
          <div className="flex items-center gap-3 mb-14 px-2.5">
            <span className="font-bold text-lg tracking-tight text-zinc-900">
              Payflow
            </span>
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

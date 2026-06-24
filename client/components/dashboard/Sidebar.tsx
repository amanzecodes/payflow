"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineSquares2X2,
  HiOutlineUserGroup,
  HiOutlineBanknotes,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { TbHistory } from "react-icons/tb";

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
  { name: "Cycles", href: "/cycles", icon: TbHistory },
  { name: "Payouts", href: "/payout", icon: HiOutlineBanknotes },
  { name: "Settings", href: "/settings", icon: HiOutlineCog6Tooth },
];

const Sidebar = ({ children }: SidebarProps) => {
  const pathname = usePathname();
  const { open, close, toggle } = useCommandPalette();

  return (
    <div className="flex h-screen w-full bg-zinc-50 text-zinc-900 overflow-hidden">
      {/* Structural Sidebar Panel */}
      <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col justify-between px-4 py-10">
        <div>
          {/* Brand/Logo Area */}
          <div className="flex items-center gap-3 mb-14 px-2.5">
            <span className="font-bold text-lg tracking-tight text-zinc-900">
              Payflow
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-2.5 py-3 rounded-lg text-sm font-medium transition-all duration-150 group ${
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

      </aside>

      {/* Main Production Workspace */}
      <main className="flex-1 bg-zinc-50 overflow-y-auto min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-end gap-3 px-8 lg:px-14 pt-6 pb-2">
          <CommandPaletteTrigger onClick={toggle} />
          <ProfileMenu />
        </div>

        <div className="px-8 lg:px-14 pt-4 pb-10 lg:pb-14 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <CommandPalette open={open} onClose={close} />
    </div>
  );
};

export default Sidebar;
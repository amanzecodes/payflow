"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { HiChevronDown, HiOutlineArrowRightOnRectangle, HiOutlineUserCircle } from "react-icons/hi2";
import { fetchCurrentAdmin, logoutRequest } from "@/lib/api/auth.api";
import type { Admin } from "@/types/auth.types";

const ProfileMenu = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const response = await fetchCurrentAdmin();
        // The /auth/me endpoint returns the admin object directly in data
        const adminData = response.data.admin || response.data;
        setAdmin(adminData);
      } catch (error) {
        console.error("Failed to load admin:", error);
        // Fallback to default admin
        setAdmin({
          id: "default",
          name: "User",
          email: "user@example.com",
          phone: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAdmin();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Logout failed, redirecting…");
      router.push("/login");
    }
  };

  if (isLoading || !admin) {
    return (
      <div className="flex items-center gap-2 pl-1 pr-2.5 py-1">
        <div className="h-7 w-7 rounded-full bg-zinc-200 animate-pulse" />
        <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-zinc-100 transition-colors"
      >
        <span className="h-7 w-7 rounded-full bg-[#0b79ff] text-white text-xs font-semibold flex items-center justify-center">
          {getInitials(admin.name)}
        </span>
        <span className="text-sm font-medium text-zinc-700">{admin.name}</span>
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
              <span className="h-9 w-9 rounded-full bg-[#0b79ff] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {getInitials(admin.name)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 truncate">{admin.name}</p>
                <p className="text-xs text-zinc-400 truncate">{admin.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
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

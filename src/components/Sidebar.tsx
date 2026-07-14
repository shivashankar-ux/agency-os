"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import type { Profile } from "@/lib/supabase/profile";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCog,
  Wallet,
  TrendingUp,
  CalendarDays,
  FolderOpen,
  BarChart3,
  Sparkles,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { canView, hasPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-mode");
      } else {
        document.documentElement.classList.remove("light-mode");
      }
    } else if (document.documentElement.classList.contains("light-mode")) {
      setTheme("light");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.add("light-mode");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const canUseAI =
    hasPermission("ai", "proposal_generator") ||
    hasPermission("ai", "marketing_ai") ||
    hasPermission("ai", "caption_generator") ||
    hasPermission("ai", "reports_ai");

  const links = profile.role === "client"
    ? [
        { href: "/dashboard/client-portal", label: "Client Portal", icon: LayoutDashboard, show: true },
        { href: "/dashboard/settings", label: "Settings", icon: UserCog, show: true },
      ]
    : [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
        { href: "/dashboard/clients", label: "Clients", icon: Users, show: canView("clients") },
        { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare, show: canView("tasks") },
        { href: "/dashboard/crm", label: "Sales CRM", icon: TrendingUp, show: profile.role === "owner" || profile.role === "admin" },
        { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, show: canView("calendar") },
        { href: "/dashboard/files", label: "Files", icon: FolderOpen, show: canView("files") },
        { href: "/dashboard/reports", label: "Reports", icon: BarChart3, show: canView("reports") },
        { href: "/dashboard/ai", label: "AI Copilot", icon: Sparkles, show: canUseAI },
        { href: "/dashboard/team", label: "Team", icon: UserCog, show: profile.role === "owner" || profile.role === "admin" },
        { href: "/dashboard/finance", label: "Finance", icon: Wallet, show: profile.role === "owner" || profile.role === "admin" },
        { href: "/dashboard/settings", label: "Settings", icon: UserCog, show: true },
      ];

  const filteredLinks = links.filter((l) => l.show);

  // Current page label for mobile header
  const currentPage = filteredLinks.find((l) => l.href === pathname)?.label || "Dashboard";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {filteredLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium ${
                active
                  ? "bg-indigo-650 text-white shadow-md shadow-indigo-900/10"
                  : "text-neutral-450 hover:bg-neutral-850 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-5 py-3 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-neutral-500 text-xs font-semibold">Appearance</span>
        <button
          onClick={toggleTheme}
          className="relative w-12 h-6 rounded-full bg-neutral-800 p-0.5 transition-colors duration-300 focus:outline-none flex items-center cursor-pointer border border-neutral-700"
          aria-label="Toggle Theme"
        >
          <motion.div
            className={`w-5 h-5 rounded-full flex items-center justify-center transform transition-transform duration-300 ${
              theme === "light" ? "translate-x-6 bg-amber-500" : "translate-x-0 bg-indigo-600"
            }`}
            animate={{ x: theme === "light" ? 24 : 0 }}
          >
            {theme === "light" ? (
              <Sun size={12} className="text-white-literal" />
            ) : (
              <Moon size={12} className="text-white-literal" />
            )}
          </motion.div>
        </button>
      </div>

      {/* User */}
      <div className="p-3 border-t border-neutral-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-semibold truncate">{profile.name}</p>
          <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider capitalize">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-550 hover:bg-neutral-850 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── MOBILE TOP BAR ────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 gap-3 shadow-md">
        {/* Hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white hover:bg-neutral-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Logo + Page */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-instagram-gradient flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0">
            S
          </div>
          <span className="text-white font-semibold text-sm truncate">{currentPage}</span>
        </div>

        {/* Theme toggle right side */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* ─── MOBILE DRAWER ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Slide-in drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col lg:hidden shadow-2xl"
            >
              {/* Drawer header */}
              <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-instagram-gradient flex items-center justify-center text-white font-extrabold text-base shadow-md">
                    S
                  </div>
                  <div>
                    <h1 className="text-white font-extrabold text-sm tracking-tight bg-instagram-gradient bg-clip-text text-transparent">
                      The Story Builder
                    </h1>
                    <p className="text-neutral-500 text-[9px] font-bold uppercase tracking-wider">Agency OS</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP SIDEBAR ───────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-neutral-900 border-r border-neutral-800 flex-col">
        <div className="p-5 border-b border-neutral-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-instagram-gradient flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
            S
          </div>
          <div>
            <h1 className="text-white font-extrabold text-sm tracking-tight bg-instagram-gradient bg-clip-text text-transparent">
              The Story Builder
            </h1>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
              Agency OS
            </p>
          </div>
        </div>

        <SidebarContent />
      </aside>
    </>
  );
}
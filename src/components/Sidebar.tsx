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
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { canView, hasPermission } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

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

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden drawer"
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="drawer-content flex flex-col"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer header */}
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-instagram-gradient flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                    S
                  </div>
                  <div>
                    <h1 className="text-white font-extrabold text-base tracking-tight bg-instagram-gradient bg-clip-text text-transparent">
                      The Story Builder
                    </h1>
                    <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                      Agency OS
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-neutral-800 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {filteredLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base transition-colors font-medium ${
                        active
                          ? "bg-indigo-650 text-white shadow-md shadow-indigo-900/10"
                          : "text-neutral-400 hover:bg-neutral-850 hover:text-white"
                      }`}
                    >
                      <Icon size={20} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Theme Toggle */}
              <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-neutral-400 text-xs font-semibold">Appearance</span>
                <button
                  onClick={toggleTheme}
                  className="relative w-12 h-6 rounded-full bg-neutral-800 p-0.5 transition-colors duration-300 focus:outline-none flex items-center cursor-pointer border border-neutral-700"
                  aria-label="Toggle Theme"
                >
                  <motion.div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 ${
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

              {/* User section */}
              <div className="p-4 border-t border-neutral-800">
                <div className="px-3 py-2 mb-2">
                  <p className="text-white text-base font-semibold truncate">{profile.name}</p>
                  <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider capitalize">{profile.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-neutral-400 hover:bg-neutral-850 hover:text-white transition-colors touch-target"
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
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

        <nav className="flex-1 p-3 space-y-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
                  active
                    ? "bg-indigo-650 text-white-literal shadow-md shadow-indigo-900/10"
                    : "text-neutral-450 hover:bg-neutral-850 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle Section */}
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

        <div className="p-3 border-t border-neutral-800">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-sm font-semibold truncate">{profile.name}</p>
            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider capitalize">{profile.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-550 hover:bg-neutral-850 hover:text-white transition-colors touch-target"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  UserCog,
  Wallet,
  LogOut,
} from "lucide-react";

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { href: "/dashboard/clients", label: "Clients", icon: Users, show: true },
    { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare, show: true },
    {
      href: "/dashboard/team",
      label: "Team",
      icon: UserCog,
      show: profile.role === "owner",
    },
    {
      href: "/dashboard/finance",
      label: "Finance",
      icon: Wallet,
      show: profile.role === "owner",
    },
  ];

  return (
    <aside className="w-60 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      <div className="p-5 border-b border-neutral-800">
        <h1 className="text-white font-semibold text-sm">The Story Builder</h1>
        <p className="text-neutral-500 text-xs mt-0.5">Agency OS</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links
          .filter((l) => l.show)
          .map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                }`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="p-3 border-t border-neutral-800">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{profile.name}</p>
          <p className="text-neutral-500 text-xs capitalize">{profile.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}

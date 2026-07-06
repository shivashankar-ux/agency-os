"use client";

import Link from "next/link";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import { UserPlus, FolderPlus, UserCheck, Settings, Users, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions() {
  const { canCreate, hasPermission } = usePermissions();

  const allActions = [
    {
      title: "Add Client",
      desc: "Register new business client",
      href: "/dashboard/clients",
      icon: UserPlus,
      color: "text-indigo-400 border-indigo-900/40 bg-indigo-950/20",
      show: canCreate("clients"),
    },
    {
      title: "Manage Projects",
      desc: "Assign projects to clients",
      href: "/dashboard/clients",
      icon: FolderPlus,
      color: "text-purple-400 border-purple-900/40 bg-purple-950/20",
      show: canCreate("projects"),
    },
    {
      title: "Invite Teammate",
      desc: "Onboard new team members",
      href: "/dashboard/team",
      icon: Users,
      color: "text-emerald-400 border-emerald-900/40 bg-emerald-950/20",
      show: hasPermission("team", "invite"),
    },
    {
      title: "Set Permissions",
      desc: "Configure access policies",
      href: "/dashboard/team/permissions",
      icon: UserCheck,
      color: "text-amber-400 border-amber-900/40 bg-amber-950/20",
      show: hasPermission("team", "change_roles"),
    },
  ];

  const visibleActions = allActions.filter((act) => act.show);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
      <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">
        Quick System Actions
      </h3>

      {visibleActions.length === 0 ? (
        <div className="flex items-center gap-2.5 p-4 rounded-xl border border-neutral-850 bg-neutral-950/50 text-neutral-500 text-xs italic">
          <Lock size={14} className="text-neutral-600" />
          No quick actions available. Contact your supervisor to request permission.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {visibleActions.map((act, index) => {
            const Icon = act.icon;
            return (
              <motion.div
                key={act.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link
                  href={act.href}
                  className="group flex items-start gap-3.5 p-4 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/30 hover:border-neutral-700 transition-all duration-200"
                >
                  <div className={`p-2.5 rounded-lg border ${act.color} flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-xs font-semibold group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                      {act.title}
                      <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </h4>
                    <p className="text-neutral-500 text-xxs mt-0.5 truncate leading-relaxed">
                      {act.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

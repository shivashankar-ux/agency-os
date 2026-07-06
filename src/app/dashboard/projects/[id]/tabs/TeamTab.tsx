"use client";

import { motion } from "framer-motion";
import { Users, Crown, Shield, User } from "lucide-react";

interface TeamMember {
  profiles: {
    id: string;
    name: string;
    email: string;
    role: string;
    job_title?: string | null;
  } | null;
}

interface TeamTabProps {
  members: TeamMember[];
  createdBy?: string | null;
}

const roleConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-400", bg: "bg-amber-950 border-amber-900" },
  manager: { label: "Manager", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-950 border-indigo-900" },
  member: { label: "Member", icon: User, color: "text-neutral-400", bg: "bg-neutral-800 border-neutral-700" },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const avatarColors = [
  "bg-violet-600", "bg-indigo-600", "bg-blue-600", "bg-teal-600",
  "bg-emerald-600", "bg-amber-600", "bg-rose-600",
];

export default function TeamTab({ members, createdBy }: TeamTabProps) {
  // Filter out null profiles and deduplicate by id
  const validMembers = members
    .filter((m): m is TeamMember & { profiles: NonNullable<TeamMember["profiles"]> } => m.profiles !== null)
    .filter((m, i, arr) => arr.findIndex((x) => x.profiles.id === m.profiles.id) === i);

  return (
    <div className="space-y-4">
      <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
        <Users size={13} className="text-indigo-400" />
        {validMembers.length} Team Member{validMembers.length !== 1 ? "s" : ""}
      </p>

      {validMembers.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-neutral-800 rounded-xl">
          <Users size={24} className="text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-xs italic">No team members assigned to this project yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {validMembers.map((m, index) => {
            const profile = m.profiles;
            const rc = roleConfig[profile.role] || roleConfig.member;
            const RoleIcon = rc.icon;
            const color = avatarColors[index % avatarColors.length];
            const isLead = profile.id === createdBy;

            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-3 hover:border-neutral-750 transition-colors"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                  {getInitials(profile.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-xs font-semibold">{profile.name}</span>
                    {isLead && (
                      <span className="text-amber-400 text-xxs bg-amber-950 border border-amber-900 px-1.5 rounded font-semibold">
                        Lead
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-500 text-xxs mt-0.5 truncate">{profile.email}</p>
                  {profile.job_title && (
                    <p className="text-neutral-600 text-xxs italic truncate">{profile.job_title}</p>
                  )}
                </div>

                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xxs font-semibold shrink-0 ${rc.bg} ${rc.color}`}>
                  <RoleIcon size={10} />
                  {rc.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

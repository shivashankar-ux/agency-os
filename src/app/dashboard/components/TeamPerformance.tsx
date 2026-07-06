"use client";

import { Award, Briefcase, ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import type { TeamPerformanceItem } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

interface TeamPerformanceProps {
  teamPerformance: TeamPerformanceItem[];
}

export default function TeamPerformance({ teamPerformance }: TeamPerformanceProps) {
  if (teamPerformance.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm text-center text-neutral-500 text-xs py-8">
        No active team performance recorded.
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase flex items-center gap-1.5">
          <Trophy size={16} className="text-amber-500" />
          Teammate Leaderboard
        </h3>
        <Link
          href="/dashboard/team"
          className="text-neutral-500 hover:text-white text-xs font-semibold flex items-center gap-0.5 transition-colors"
        >
          Manage Team
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs min-w-[500px]">
          <thead>
            <tr className="border-b border-neutral-850 text-neutral-500 bg-neutral-950/20 font-medium">
              <th className="pb-3.5 pt-1.5 px-2">Member</th>
              <th className="pb-3.5 pt-1.5 px-2">Completed</th>
              <th className="pb-3.5 pt-1.5 px-2">Open Tasks</th>
              <th className="pb-3.5 pt-1.5 px-2 w-1/3">Completion Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850/40">
            {teamPerformance.map((member, index) => {
              const isTop = index === 0 && member.completedTasks > 0;
              return (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-neutral-850/15 transition-colors"
                >
                  {/* Team member name and info */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2">
                      {isTop ? (
                        <div className="bg-amber-950/40 text-amber-500 border border-amber-900/50 p-1.5 rounded-lg flex items-center justify-center">
                          <Award size={14} />
                        </div>
                      ) : (
                        <div className="bg-neutral-800 text-neutral-400 p-1.5 rounded-lg flex items-center justify-center">
                          <Briefcase size={14} />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold flex items-center gap-1.5">
                          {member.name}
                          {isTop && (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-950/40 border border-amber-900/50 px-1 py-0.2 rounded uppercase">
                              Top Performer
                            </span>
                          )}
                        </p>
                        {member.jobTitle && (
                          <p className="text-neutral-500 text-xxs mt-0.5">{member.jobTitle}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Completed Tasks Count */}
                  <td className="py-3.5 px-2 text-neutral-300 font-semibold">
                    {member.completedTasks} task{member.completedTasks === 1 ? "" : "s"}
                  </td>

                  {/* Open Tasks Count */}
                  <td className="py-3.5 px-2 text-neutral-400 font-medium">
                    {member.openTasks} active
                  </td>

                  {/* Completion percentage bar */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${member.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold min-w-[32px] text-right">
                        {member.completionPercent}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

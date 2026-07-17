"use client";

import { useState } from "react";
import { Users, Briefcase, AlertTriangle, TrendingUp, ShieldAlert, Award } from "lucide-react";
import type { TeamPerformanceItem } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

// Flexible project type that works with both DashboardProject and ProjectProgressItem
interface ProjectData {
  id: string;
  name: string;
  clientName?: string;
  client_name?: string;
  status: string;
  dueDate?: string | null;
  deadline?: string;
  completionPercent?: number;
  progress?: number;
  ownerName?: string;
  healthStatus?: "on_track" | "at_risk" | "overdue";
  priority?: string;
  task_count?: number;
  completed_task_count?: number;
  overdueTasksCount?: number;
}

interface PerformanceWidgetProps {
  teamPerformance: TeamPerformanceItem[];
  mostActiveProjects: ProjectData[];
  mostDelayedProjects: ProjectData[];
}

export default function PerformanceWidget({
  teamPerformance,
  mostActiveProjects,
  mostDelayedProjects,
}: PerformanceWidgetProps) {
  const [activeTab, setActiveTab] = useState<"team" | "active_projects" | "delayed_projects">("team");

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-800 pb-4 mb-4 gap-3">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
          <TrendingUp size={15} className="text-indigo-400" />
          Performance & Analytics
        </h3>
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800/80">
          <button
            onClick={() => setActiveTab("team")}
            className={`px-2.5 py-1 text-xxs font-semibold rounded-md transition-all ${
              activeTab === "team" ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"
            }`}
          >
            Team Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("active_projects")}
            className={`px-2.5 py-1 text-xxs font-semibold rounded-md transition-all ${
              activeTab === "active_projects" ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"
            }`}
          >
            Active Projects
          </button>
          {mostDelayedProjects.length > 0 && (
            <button
              onClick={() => setActiveTab("delayed_projects")}
              className={`px-2.5 py-1 text-xxs font-semibold rounded-md transition-all ${
                activeTab === "delayed_projects" ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"
              }`}
            >
              Delayed
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[300px] overflow-y-auto max-h-[360px] pr-1 space-y-3">
        {activeTab === "team" && (
          <div className="space-y-3">
            {teamPerformance.length === 0 ? (
              <p className="text-neutral-500 text-xs italic text-center py-8">No team metrics available.</p>
            ) : (
              teamPerformance.map((member, index) => {
                const isTop = index === 0;
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl hover:border-neutral-750 transition-colors flex items-center justify-between gap-4 text-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg border ${
                        isTop ? "bg-amber-950/20 border-amber-900/40 text-amber-400" : "bg-neutral-900 border-neutral-800 text-neutral-500"
                      } flex-shrink-0 relative`}>
                        {isTop ? <Award size={14} /> : <Users size={14} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-white font-semibold truncate flex items-center gap-1.5">
                          {member.name}
                          {isTop && (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950 border border-amber-900 px-1 py-0.2 rounded-md">
                              Top Performer
                            </span>
                          )}
                        </h4>
                        <p className="text-neutral-500 text-xxs mt-0.5 truncate leading-relaxed">
                          {member.jobTitle || "Team Member"} · {member.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 text-right">
                      <div className="text-xxs">
                        <span className="text-white font-semibold">{member.completedTasks}</span>
                        <span className="text-neutral-500 font-medium"> done</span>
                        <span className="text-neutral-500 block text-[9px] mt-0.5">{member.openTasks} pending</span>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-white font-bold text-xxs">{member.completionPercent}%</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "active_projects" && (
          <div className="space-y-3">
            {mostActiveProjects.length === 0 ? (
              <p className="text-neutral-500 text-xs italic text-center py-8">No project activity recorded.</p>
            ) : (
              mostActiveProjects.map((proj, index) => {
                return (
                  <motion.div
                    key={proj.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl hover:border-neutral-750 transition-colors flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-semibold truncate flex items-center gap-1.5">
                        <Briefcase size={13} className="text-neutral-500 shrink-0" />
                        {proj.name}
                      </h4>
<p className="text-neutral-500 text-xxs mt-0.5 truncate leading-relaxed">
                          Client: <span className="text-neutral-400 font-semibold">{proj.clientName || proj.client_name}</span> | Lead: {proj.ownerName}
                      </p>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden shrink-0">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${proj.completionPercent ?? proj.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-white font-bold text-xxs min-w-[28px]">
                          {proj.completionPercent ?? proj.progress ?? 0}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "delayed_projects" && (
          <div className="space-y-3">
            {mostDelayedProjects.map((proj, index) => {
              return (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-3 bg-neutral-950/40 border border-red-900/30 rounded-xl hover:border-red-900/50 transition-colors flex items-center justify-between gap-4 text-xs group"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white font-semibold truncate flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-red-400 shrink-0" />
                      {proj.name}
                    </h4>
                    <p className="text-neutral-500 text-xxs mt-0.5 truncate leading-relaxed">
                      Client: <span className="text-neutral-400 font-semibold">{proj.clientName || proj.client_name}</span> · Due: {proj.dueDate || proj.deadline || "Not set"}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="text-red-400 font-bold bg-red-950/40 border border-red-900/60 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
                      <ShieldAlert size={10} />
                      {proj.overdueTasksCount} overdue task{proj.overdueTasksCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

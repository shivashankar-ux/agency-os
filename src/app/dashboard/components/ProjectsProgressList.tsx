"use client";

import Link from "next/link";
import { Calendar, User, ChevronRight } from "lucide-react";
import type { ProjectProgressItem } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

interface ProjectsProgressListProps {
  projects: ProjectProgressItem[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-950/30 text-green-450 border-green-900/30",
  completed: "bg-blue-950/30 text-blue-400 border-blue-900/30",
  on_hold: "bg-yellow-950/30 text-yellow-500 border-yellow-900/30",
};

export function getClientColorClass(clientName: string) {
  if (!clientName || clientName === "No Client" || clientName === "Unknown Client") {
    return "bg-neutral-800 text-neutral-400 border-neutral-700";
  }
  const colors = [
    "bg-pink-500/10 text-pink-500 border-pink-500/20",
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-rose-500/10 text-rose-550 border-rose-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function ProjectsProgressList({ projects }: ProjectsProgressListProps) {
  if (projects.length === 0) {
    return (
      <div className="card-glass rounded-2xl p-5 shadow-sm text-center text-neutral-500 text-xs py-8">
        No active projects found. Assign a client to a project to get started.
      </div>
    );
  }

  return (
    <div className="card-glass rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white text-xs font-bold tracking-wider uppercase">
          Projects Progress
        </h3>
        <Link
          href="/dashboard/clients"
          className="text-neutral-500 hover:text-white text-xs font-semibold flex items-center gap-0.5 transition-colors"
        >
          View All Clients
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-550 font-bold uppercase tracking-wider bg-neutral-950/10 text-[10px]">
              <th className="pb-3.5 pt-1.5 px-3">Project</th>
              <th className="pb-3.5 pt-1.5 px-3">Client</th>
              <th className="pb-3.5 pt-1.5 px-3 w-1/3">Progress</th>
              <th className="pb-3.5 pt-1.5 px-3">Due Date</th>
              <th className="pb-3.5 pt-1.5 px-3">Status</th>
              <th className="pb-3.5 pt-1.5 px-3 text-right">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/40">
            {projects.map((proj, index) => {
              return (
                <motion.tr
                  key={proj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-neutral-850/10 transition-colors"
                >
                  {/* Project Name */}
                  <td className="py-4 px-3 font-bold text-white">
                    <Link
                      href={`/dashboard/clients/${proj.id}`}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      {proj.name}
                    </Link>
                  </td>

                  {/* Client Name (Highlighted) */}
                  <td className="py-4 px-3">
                    <span className={`inline-block border text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getClientColorClass(proj.clientName)}`}>
                      {proj.clientName}
                    </span>
                  </td>

                  {/* Progress bar */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-550 rounded-full transition-all duration-500"
                          style={{ width: `${proj.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-white font-bold min-w-[32px] text-right">
                        {proj.completionPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-4 px-3 text-neutral-400 font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-neutral-500" />
                      <span>{proj.dueDate || "Not Set"}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-3">
                    <span
                      className={`text-xxs px-2.5 py-0.5 rounded-full border capitalize font-bold ${
                        statusColors[proj.status] || "bg-neutral-850 text-neutral-450 border-neutral-800"
                      }`}
                    >
                      {proj.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-4 px-3 text-right text-neutral-300 font-semibold">
                    <div className="flex items-center justify-end gap-1.5">
                      <User size={12} className="text-neutral-500" />
                      <span>{proj.ownerName}</span>
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

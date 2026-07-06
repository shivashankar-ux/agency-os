"use client";

import Link from "next/link";
import { Calendar, User, ChevronRight } from "lucide-react";
import type { ProjectProgressItem } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

interface ProjectsProgressListProps {
  projects: ProjectProgressItem[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-950 text-green-400 border-green-900/50",
  completed: "bg-blue-950 text-blue-400 border-blue-900/50",
  on_hold: "bg-yellow-950 text-yellow-400 border-yellow-900/50",
};

export default function ProjectsProgressList({ projects }: ProjectsProgressListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm text-center text-neutral-500 text-xs py-8">
        No active projects found. Assign a client to a project to get started.
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase">
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
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-neutral-850 text-neutral-500 bg-neutral-950/20 font-medium">
              <th className="pb-3.5 pt-1.5 px-2">Project</th>
              <th className="pb-3.5 pt-1.5 px-2">Client</th>
              <th className="pb-3.5 pt-1.5 px-2 w-1/3">Progress</th>
              <th className="pb-3.5 pt-1.5 px-2">Due Date</th>
              <th className="pb-3.5 pt-1.5 px-2">Status</th>
              <th className="pb-3.5 pt-1.5 px-2 text-right">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850/40">
            {projects.map((proj, index) => {
              return (
                <motion.tr
                  key={proj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="hover:bg-neutral-850/15 transition-colors"
                >
                  {/* Project Name */}
                  <td className="py-3 px-2 font-semibold">
                    <Link
                      href={`/dashboard/clients/${proj.id}`} // Routes to project detail inside client
                      className="text-white hover:text-indigo-400 transition-colors"
                    >
                      {proj.name}
                    </Link>
                  </td>

                  {/* Client Name */}
                  <td className="py-3 px-2 text-neutral-400 font-medium">
                    {proj.clientName}
                  </td>

                  {/* Progress bar */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${proj.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold min-w-[32px] text-right">
                        {proj.completionPercent}%
                      </span>
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-2 text-neutral-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-neutral-500" />
                      <span>{proj.dueDate || "Not Set"}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-2">
                    <span
                      className={`text-xxs px-2 py-0.5 rounded-full border capitalize font-semibold ${
                        statusColors[proj.status] || "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {proj.status.replace("_", " ")}
                    </span>
                  </td>

                  {/* Owner */}
                  <td className="py-3 px-2 text-right text-neutral-300 font-medium">
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

"use client";

import { Calendar, AlertTriangle, Play, HelpCircle, CheckSquare } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

interface TodayScheduleProps {
  schedule: DashboardData["schedule"];
}

const priorityConfig: Record<string, { label: string; style: string }> = {
  high: { label: "High", style: "bg-red-950/40 text-red-400 border-red-900/50" },
  medium: { label: "Medium", style: "bg-blue-950/40 text-blue-400 border-blue-900/50" },
  low: { label: "Low", style: "bg-neutral-800 text-neutral-400 border-neutral-750" },
};

export default function TodaySchedule({ schedule }: TodayScheduleProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">
        Today's Schedule & Deadlines
      </h3>

      <div className="space-y-4 flex-1">
        {/* Meetings Section (Future Support Placeholder) */}
        <div className="bg-neutral-950/50 border border-neutral-850 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-semibold">Scheduled Meetings</span>
            <span className="text-neutral-500 text-xxs font-semibold uppercase bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
              Coming Soon
            </span>
          </div>
          <p className="text-neutral-500 text-xxs mt-1.5 leading-relaxed">
            Calendar integration & Google Meet sync are scheduled for future development phases.
          </p>
        </div>

        {/* Actionable Deadlines */}
        <div className="space-y-2">
          <span className="text-neutral-400 text-xxs font-semibold tracking-wide uppercase block mb-1">
            Deadlines & Active Tasks
          </span>

          {schedule.length === 0 ? (
            <div className="bg-neutral-950/30 border border-dashed border-neutral-800 rounded-xl p-6 text-center text-neutral-500 text-xs italic">
              No tasks due today. You are fully up to date!
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {schedule.map((item, index) => {
                const prio = priorityConfig[item.priority] || priorityConfig.low;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="p-3 bg-neutral-950/40 border border-neutral-850 rounded-xl hover:border-neutral-750 transition-colors flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-neutral-500 flex-shrink-0" />
                        {item.title}
                      </h4>
                      <p className="text-neutral-500 text-xxs mt-0.5 truncate">
                        {item.clientName} · {item.projectName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xxs px-2 py-0.2 rounded border capitalize font-semibold ${prio.style}`}>
                        {prio.label}
                      </span>
                      <span className="text-neutral-500 text-xxs flex items-center gap-0.5">
                        <Calendar size={11} />
                        {item.dueDate}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

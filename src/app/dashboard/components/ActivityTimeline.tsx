"use client";

import { 
  FolderPlus, CheckCircle, UserPlus, Users, PlusCircle, Clock 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityItem } from "@/lib/dashboard-data";
import { motion } from "framer-motion";

interface ActivityTimelineProps {
  activities: ActivityItem[];
}

const typeConfig = {
  project_created: {
    icon: FolderPlus,
    color: "bg-indigo-950/60 text-indigo-400 border-indigo-900/50",
  },
  task_assigned: {
    icon: PlusCircle,
    color: "bg-blue-950/60 text-blue-400 border-blue-900/50",
  },
  task_completed: {
    icon: CheckCircle,
    color: "bg-green-950/60 text-green-400 border-green-900/50",
  },
  client_added: {
    icon: UserPlus,
    color: "bg-purple-950/60 text-purple-400 border-purple-900/50",
  },
  member_invited: {
    icon: Users,
    color: "bg-emerald-950/60 text-emerald-400 border-emerald-900/50",
  },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm text-center text-neutral-500 text-xs py-8">
        No recent activities recorded.
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <h3 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">
        Recent Activity Timeline
      </h3>

      <div className="relative border-l border-neutral-800 pl-4 space-y-4 flex-1">
        {activities.map((act, index) => {
          const config = typeConfig[act.type] || {
            icon: Clock,
            color: "bg-neutral-850 text-neutral-400 border-neutral-800",
          };
          const Icon = config.icon;

          let relativeTime = "";
          try {
            relativeTime = formatDistanceToNow(new Date(act.time), { addSuffix: true });
          } catch {
            relativeTime = "recently";
          }

          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="relative group"
            >
              {/* Dot indicator on timeline */}
              <div className="absolute -left-[25px] top-1.5 flex items-center justify-center">
                <div className={`p-1 rounded-full border ${config.color} flex items-center justify-center`}>
                  <Icon size={12} />
                </div>
              </div>

              <div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  <span className="text-white font-semibold">{act.user}</span>{" "}
                  {act.action}
                </p>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-neutral-500 text-xxs flex items-center gap-1 font-medium">
                    <Clock size={10} />
                    {relativeTime}
                  </span>
                  {act.projectName && (
                    <span className="text-neutral-500 text-xxs">
                      · <span className="text-indigo-400 font-medium">{act.projectName}</span>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

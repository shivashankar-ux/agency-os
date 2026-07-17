"use client";

import { useState } from "react";
import { Bell, BellOff, Calendar, AlertTriangle, Info, Check, ShieldAlert } from "lucide-react";
import type { NotificationItem } from "@/lib/dashboard-data";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationsWidgetProps {
  notifications: NotificationItem[];
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  due_today: {
    icon: Calendar,
    color: "text-indigo-400",
    bg: "bg-indigo-950/30",
    border: "border-indigo-900/50",
  },
  task_update: {
    icon: ShieldAlert,
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-900/50",
  },
  project_update: {
    icon: AlertTriangle,
    color: "text-yellow-400",
    bg: "bg-yellow-950/30",
    border: "border-yellow-900/50",
  },
  info: {
    icon: Info,
    color: "text-neutral-400",
    bg: "bg-neutral-900/50",
    border: "border-neutral-850",
  },
};

export default function NotificationsWidget({ notifications: initialNotifications }: NotificationsWidgetProps) {
  const [list, setList] = useState<NotificationItem[]>(initialNotifications);

  function handleClear(id: string) {
    setList((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearAll() {
    setList([]);
  }

  const unreadCount = list.length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-semibold tracking-wide uppercase flex items-center gap-2">
          <Bell size={15} className="text-indigo-400" />
          Workspace Alerts
          {unreadCount > 0 && (
            <span className="bg-indigo-600 text-white-literal text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-neutral-500 hover:text-white text-xxs font-semibold flex items-center gap-1 transition-colors bg-neutral-950 border border-neutral-800/80 px-2 py-1 rounded-md"
          >
            <Check size={10} />
            Dismiss All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[360px] pr-1 space-y-2">
        <AnimatePresence initial={false}>
          {list.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center gap-3 text-neutral-500 italic"
            >
              <div className="p-3 bg-neutral-950/40 border border-neutral-850 rounded-full text-neutral-600">
                <BellOff size={20} />
              </div>
              <span className="text-xs">No alerts or warnings recorded.</span>
            </motion.div>
          ) : (
            list.map((item) => {
              const cfg = typeConfig[item.type] || typeConfig.info;
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-xl border flex items-start gap-3 bg-neutral-950/30 ${cfg.border} hover:bg-neutral-850/10 transition-colors group`}
                >
                  <div className={`p-2 rounded-lg border ${cfg.bg} ${cfg.color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white text-xs font-semibold block truncate">
                        {item.title}
                      </span>
                      <button
                        onClick={() => handleClear(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-800 rounded text-neutral-500 hover:text-white transition-all"
                        title="Dismiss alert"
                      >
                        <Check size={11} />
                      </button>
                    </div>
                    <p className="text-neutral-400 text-[11px] leading-relaxed mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

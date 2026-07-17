"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, CheckSquare, Clock } from "lucide-react";
import TaskDetailModal from "@/app/dashboard/components/TaskDetailModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type Profile = {
  id: string;
  name: string;
  role: string;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  projects?: {
    name: string;
    clients?: {
      name: string;
    } | null;
  } | null;
  assignee?: {
    id: string;
    name: string;
    role: string;
  } | null;
};

type MemberClientsCalendarProps = {
  tasks: Task[];
  currentProfile: Profile;
  allProfiles: Profile[];
};

export default function MemberClientsCalendar({
  tasks,
  currentProfile,
  allProfiles,
}: MemberClientsCalendarProps) {
  const router = useRouter();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Group tasks by due date
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Generate month days grid
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<Date | null> = [];

    // Pad previous month days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Main month days
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    // Pad next month days to align to 7-column rows
    while (days.length % 7 !== 0) {
      days.push(null);
    }
    return days;
  }, [viewDate]);

  return (
    <div className="space-y-4">
      {/* Calendar Header with navigation controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-850 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-white text-base font-bold flex items-center gap-2">
            <Calendar size={18} className="text-indigo-400" />
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="text-xxs px-2 py-0.5 text-neutral-450 hover:text-white font-bold cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="text-neutral-500 text-xs font-medium">
          Showing {tasks.length} assigned task{tasks.length === 1 ? "" : "s"}
        </div>
      </div>

      {/* Calendar month grid */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-xl overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-950/20">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2.5 text-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid cells */}
        <div className="grid grid-cols-7">
          {monthDays.map((day, idx) => {
            const key = day ? dateKey(day) : null;
            const dayTasks = key ? (tasksByDay[key] ?? []) : [];
            const isToday = day ? isSameDay(day, today) : false;
            const isCurrentMonth = day ? day.getMonth() === viewDate.getMonth() : false;

            return (
              <div
                key={idx}
                className={`min-h-[105px] p-2 border-b border-r border-neutral-800/40 transition-colors relative select-none
                  ${day ? "bg-neutral-900/60" : "bg-neutral-955/20"}
                  ${idx % 7 === 6 ? "border-r-0" : ""}`}
              >
                {day && (
                  <>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xxs font-bold mb-1.5 mx-auto
                      ${isToday ? "bg-indigo-600 text-white-literal shadow-sm font-extrabold" : isCurrentMonth ? "text-white" : "text-neutral-700"}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.map((t) => {
                        const clientName = t.projects?.clients?.name || "No Client";
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTask(t)}
                            className="w-full bg-neutral-955 border border-neutral-800 hover:bg-neutral-800 text-[10px] text-left text-neutral-300 hover:text-white px-2 py-0.5 rounded truncate block transition-all font-medium cursor-pointer"
                          >
                            <span className="text-[8px] text-indigo-400 block font-bold truncate uppercase">{clientName}</span>
                            <span className="truncate block mt-0.5">{t.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Details Modal popup on click */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentProfile={currentProfile}
          allProfiles={allProfiles}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

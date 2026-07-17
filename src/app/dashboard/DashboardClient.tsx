"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  HeartHandshake, Briefcase, Clock, CheckCircle, Users, DollarSign, Receipt, BellRing, 
  FileText, CheckSquare, Plus, Trash2, CheckCircle2, Circle, Eye, EyeOff
} from "lucide-react";
import KpiCard from "./components/KpiCard";
import QuickActions from "./components/QuickActions";
import ActivityTimeline from "./components/ActivityTimeline";
import TaskCharts from "./components/TaskCharts";
import ProjectsProgressList from "./components/ProjectsProgressList";
import TodaySchedule from "./components/TodaySchedule";
import TeamPerformance from "./components/TeamPerformance";
import NotificationsWidget from "./components/NotificationsWidget";
import PerformanceWidget from "./components/PerformanceWidget";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PushNotificationPanel } from "@/components/PushNotificationPanel";
import type { DashboardData, DashboardPermissions, Profile } from "./types";

type Props = {
  profile: Profile;
  workspaceName: string;
  data: DashboardData;
  permissions: DashboardPermissions;
  formattedRevenue: string;
  formattedPendingRevenue: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export default function DashboardClient({
  profile,
  workspaceName,
  data,
  permissions,
  formattedRevenue,
  formattedPendingRevenue,
}: Props) {
  const { 
    kpis, 
    activities, 
    taskStatus, 
    taskPriority, 
    projects, 
    mostActiveProjects,
    mostDelayedProjects,
    notifications,
    schedule, 
    teamPerformance 
  } = data;

  const {
    canViewClients,
    canViewProjects,
    canViewTasks,
    canViewTeam,
    canViewRevenue,
    canViewAnalytics,
    canViewTeamPerformance,
  } = permissions;

  // Widget visibility state
  const [visibleWidgets, setVisibleWidgets] = useState({
    kpis: true,
    quickActions: true,
    charts: true,
    projects: true,
    timeline: true,
    todaySchedule: true,
    notifications: true,
    leaderboards: true,
    notesChecklist: true,
  });

  // Notes & Checklist local state for the dashboard widget
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    // Load widget configurations
    const storedVisibility = localStorage.getItem("dashboard_widgets_visibility");
    if (storedVisibility) {
      try {
        setVisibleWidgets(JSON.parse(storedVisibility));
      } catch (e) {}
    }

    // Load Notepad
    const storedNotes = localStorage.getItem("personal_dashboard_notes");
    if (storedNotes) {
      setNotes(storedNotes);
    }

    // Load Checklist
    const storedChecklist = localStorage.getItem("personal_dashboard_checklist");
    if (storedChecklist) {
      try {
        setChecklist(JSON.parse(storedChecklist));
      } catch (e) {}
    }
  }, []);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    localStorage.setItem("personal_dashboard_notes", val);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      text: newTodo.trim(),
      completed: false
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
    setNewTodo("");
  };

  const handleToggleTodo = (id: string) => {
    const updated = checklist.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
  };

  const handleDeleteTodo = (id: string) => {
    const updated = checklist.filter(t => t.id !== id);
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Push Notification Panel - Mobile first */}
      <div className="lg:hidden mb-4">
        <PushNotificationPanel />
      </div>
      
      {/* SECTION 2: Dynamic KPI Cards */}
      <AnimatePresence mode="popLayout">
        {visibleWidgets.kpis && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {canViewClients && (
              <KpiCard
                label="Total Clients"
                value={kpis.totalClients}
                icon={<HeartHandshake size={18} />}
                href="/dashboard/clients"
              />
            )}
            {canViewProjects && (
              <KpiCard
                label="Active Projects"
                value={kpis.activeProjects}
                icon={<Briefcase size={18} />}
                href="/dashboard/clients"
              />
            )}
            {canViewTasks && (
              <KpiCard
                label="Pending Tasks"
                value={kpis.pendingTasks}
                icon={<Clock size={18} />}
                href="/dashboard/tasks"
              />
            )}
            {canViewTasks && (
              <KpiCard
                label="Completed Tasks"
                value={kpis.completedTasks}
                icon={<CheckCircle size={18} />}
                href="/dashboard/tasks"
              />
            )}
            {canViewTasks && (
              <KpiCard
                label="Completed Today"
                value={kpis.completedTodayCount}
                icon={<CheckCircle size={18} className="text-green-400" />}
                href="/dashboard/tasks"
              />
            )}
            {canViewTeam && (
              <KpiCard
                label="Team Members"
                value={kpis.teamMembers}
                icon={<Users size={18} />}
                trend={{ value: `${kpis.teamActive} Online`, isPositive: true }}
                href="/dashboard/team"
              />
            )}
            {canViewRevenue && (
              <KpiCard
                label="Paid Revenue"
                value={formattedRevenue}
                icon={<DollarSign size={18} />}
                trend={{ value: kpis.growthTrend, isPositive: true }}
                href="/dashboard/reports"
              />
            )}
            {canViewRevenue && (
              <KpiCard
                label="Pending Invoices"
                value={formattedPendingRevenue}
                icon={<Receipt size={18} />}
                trend={{ value: `${kpis.pendingInvoicesCount} Sent`, isPositive: true }}
                href="/dashboard/reports"
              />
            )}
            {canViewTasks && (
              <KpiCard
                label="Active Deadlines"
                value={kpis.upcomingDeadlinesCount}
                icon={<BellRing size={18} />}
                href="/dashboard/calendar"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 7: Quick Actions */}
      {visibleWidgets.quickActions && (
        <QuickActions />
      )}

      {/* GRID SECTION: Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content Columns (8/12 width) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECTION 4: Task Overview Charts */}
          {visibleWidgets.charts && canViewTasks && canViewAnalytics && (
            <TaskCharts taskStatus={taskStatus} taskPriority={taskPriority} />
          )}

          {/* SECTION 5: Projects Overview */}
          {visibleWidgets.projects && canViewProjects && (
            <ProjectsProgressList projects={projects} />
          )}

          {/* SECTION 9: Performance Leaderboards */}
          {visibleWidgets.leaderboards && (canViewTeamPerformance || canViewProjects) && (
            <PerformanceWidget 
              teamPerformance={canViewTeamPerformance ? teamPerformance : []}
              mostActiveProjects={canViewProjects ? mostActiveProjects : []}
              mostDelayedProjects={canViewProjects ? mostDelayedProjects : []}
            />
          )}
        </div>

        {/* Sidebar Columns (4/12 width) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* PERSONAL NOTES & CHECKLIST WIDGET */}
          <AnimatePresence mode="popLayout">
            {visibleWidgets.notesChecklist && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 justify-between">
                  <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare size={14} className="text-indigo-400" />
                    My Notes & Checklist
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Scratchpad</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Notepad summary */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                      <FileText size={11} /> Quick Notepad
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      placeholder="Type personal notes here..."
                      className="w-full h-20 bg-neutral-950/60 border border-neutral-800 rounded-lg p-2.5 text-xxs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none font-sans"
                    />
                  </div>

                  {/* Todo list summary */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                      <CheckSquare size={11} /> Checklist ({checklist.filter(t => !t.completed).length} remaining)
                    </label>
                    <form onSubmit={handleAddTodo} className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Add quick task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xxs text-white focus:outline-none focus:border-neutral-700 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!newTodo.trim()}
                        className="bg-indigo-600 hover:bg-indigo-600 disabled:opacity-50 text-white px-2.5 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </form>

                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {checklist.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-neutral-500 italic">No checklist items</div>
                      ) : (
                        checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between bg-neutral-950/40 p-2 rounded-lg border border-neutral-850/40 group transition-all"
                          >
                            <button
                              onClick={() => handleToggleTodo(item.id)}
                              className="flex items-center gap-2 text-left flex-1 select-none cursor-pointer"
                            >
                              {item.completed ? (
                                <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                              ) : (
                                <Circle size={13} className="text-neutral-600 hover:text-indigo-400 shrink-0" />
                              )}
                              <span className={`text-[11px] truncate max-w-[160px] ${item.completed ? "line-through text-neutral-500" : "text-neutral-300"}`}>
                                {item.text}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(item.id)}
                              className="text-neutral-600 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION 8: Notifications Widget */}
          {visibleWidgets.notifications && (
            <NotificationsWidget notifications={notifications} />
          )}

          {/* Push Notification Panel - Desktop */}
          <div className="hidden lg:block">
            <PushNotificationPanel />
          </div>

          {/* SECTION 6: Today's Schedule */}
          {visibleWidgets.todaySchedule && canViewTasks && (
            <TodaySchedule schedule={schedule} />
          )}

          {/* SECTION 3: Recent Activity Timeline */}
          {visibleWidgets.timeline && (
            <ActivityTimeline activities={activities} />
          )}
        </div>
      </div>
    </div>
  );
}

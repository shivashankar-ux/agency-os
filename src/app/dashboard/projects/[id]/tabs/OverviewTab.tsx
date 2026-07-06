"use client";

import { motion } from "framer-motion";
import { 
  CheckCircle, Clock, AlertTriangle, ShieldAlert, Calendar, 
  User, TrendingUp, Activity 
} from "lucide-react";

interface OverviewTabProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
  };
  tasks: Array<{ status: string; priority: string; due_date: string | null }>;
  milestones: Array<{ status: string }>;
  deliverables: Array<{ status: string }>;
  teamMembers: Array<{ profiles: { name: string; role: string } | null }>;
}

function getHealthStatus(project: OverviewTabProps["project"], tasks: OverviewTabProps["tasks"]) {
  const today = new Date().toISOString().split("T")[0];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (project.end_date && project.end_date < today && project.status !== "completed") {
    return { label: "Delayed", color: "text-red-400", bg: "bg-red-950/40 border-red-900/50", icon: ShieldAlert };
  }
  if (project.end_date) {
    const diffDays = Math.ceil(
      (new Date(project.end_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 7 && diffDays >= 0 && completionPercent < 80) {
      return { label: "At Risk", color: "text-yellow-400", bg: "bg-yellow-950/40 border-yellow-900/50", icon: AlertTriangle };
    }
  }
  return { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-900/50", icon: CheckCircle };
}

export default function OverviewTab({ project, tasks, milestones, deliverables, teamMembers }: OverviewTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const health = getHealthStatus(project, tasks);
  const HealthIcon = health.icon;

  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const approvedDeliverables = deliverables.filter((d) => d.status === "approved").length;

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Health + Progress Ring Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress ring */}
        <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col items-center justify-center gap-3">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r={radius} fill="none" stroke="#262626" strokeWidth="10" />
            <circle
              cx="65" cy="65" r={radius} fill="none"
              stroke={completionPercent >= 80 ? "#10b981" : completionPercent >= 40 ? "#6366f1" : "#ef4444"}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <text x="65" y="65" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="22" fontWeight="700">
              {completionPercent}%
            </text>
          </svg>
          <p className="text-neutral-400 text-xs font-semibold">Overall Progress</p>
          <p className="text-neutral-500 text-xxs">{completedTasks} of {totalTasks} tasks done</p>
        </div>

        {/* Health Badge */}
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Project Health</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${health.bg}`}>
              <HealthIcon size={15} className={health.color} />
              <span className={`font-bold text-sm ${health.color}`}>{health.label}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Tasks", value: totalTasks, color: "text-white" },
              { label: "In Progress", value: inProgressTasks, color: "text-indigo-400" },
              { label: "Overdue", value: overdueTasks, color: overdueTasks > 0 ? "text-red-400" : "text-neutral-500" },
              { label: "Completed", value: completedTasks, color: "text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-neutral-950/50 border border-neutral-850 rounded-lg p-2.5">
                <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-neutral-500 text-xxs font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Info */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Start Date", value: project.start_date || "Not Set", icon: Calendar },
          { label: "Due Date", value: project.end_date || "Not Set", icon: Clock },
          { label: "Team Size", value: `${teamMembers.length} members`, icon: User },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-neutral-800 border border-neutral-750">
                <Icon size={15} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">{item.label}</p>
                <p className="text-white text-sm font-semibold mt-0.5">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Milestones & Deliverables summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-white text-xs font-bold tracking-wide uppercase mb-3 flex items-center gap-2">
            <TrendingUp size={13} className="text-indigo-400" /> Milestones
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{completedMilestones}</span>
            <span className="text-neutral-500 text-sm">/ {milestones.length} completed</span>
          </div>
          <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: milestones.length > 0 ? `${(completedMilestones / milestones.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-white text-xs font-bold tracking-wide uppercase mb-3 flex items-center gap-2">
            <Activity size={13} className="text-emerald-400" /> Deliverables
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{approvedDeliverables}</span>
            <span className="text-neutral-500 text-sm">/ {deliverables.length} approved</span>
          </div>
          <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: deliverables.length > 0 ? `${(approvedDeliverables / deliverables.length) * 100}%` : "0%" }}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-2">Project Description</p>
          <p className="text-neutral-300 text-sm leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
}

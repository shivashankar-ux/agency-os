"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import OverviewTab from "./tabs/OverviewTab";
import TasksTab from "./tabs/TasksTab";
import MilestonesTab from "./tabs/MilestonesTab";
import DeliverablesTab from "./tabs/DeliverablesTab";
import ActivityTab from "./tabs/ActivityTab";
import TeamTab from "./tabs/TeamTab";

// ---- Types ----

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  client_id: string;
  created_by: string | null;
};

type Client = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  assignee?: { id: string; name: string } | null;
};

type Milestone = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
};

type Deliverable = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  assigned_to: string | null;
  milestone_id: string | null;
  assignee?: { name: string } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user?: { name: string; role: string } | null;
};

type TeamMember = {
  profiles: { id: string; name: string; email: string; role: string; job_title?: string | null } | null;
};

type Profile = {
  id: string;
  name: string;
  role: string;
  email: string;
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-950 text-emerald-400 border-emerald-900",
  in_progress: "bg-indigo-950 text-indigo-400 border-indigo-900",
  completed: "bg-neutral-800 text-neutral-400 border-neutral-700",
  on_hold: "bg-yellow-950 text-yellow-400 border-yellow-900",
  cancelled: "bg-red-950 text-red-400 border-red-900",
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
  { key: "milestones", label: "Milestones" },
  { key: "deliverables", label: "Deliverables" },
  { key: "activity", label: "Activity" },
  { key: "team", label: "Team" },
];

export default function ProjectWorkspaceClient({
  project,
  client,
  tasks,
  milestones,
  deliverables,
  comments,
  teamMembers,
  allProfiles,
  permissions,
}: {
  project: Project;
  client: Client;
  tasks: Task[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  comments: Comment[];
  teamMembers: TeamMember[];
  allProfiles: Profile[];
  permissions: any;
}) {
  const [activeTab, setActiveTab] = useState("overview");

  const canCreate = permissions?.projects?.edit?.allowed || permissions?.tasks?.edit?.allowed || false;
  const canApprove = permissions?.projects?.edit?.allowed || false;

  const statusColor = STATUS_COLORS[project.status] || STATUS_COLORS.active;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xxs text-neutral-500 font-medium">
          <Link href="/dashboard/clients" className="hover:text-white transition-colors">Clients</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${client.id}`} className="hover:text-white transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-white">{project.name}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/clients/${client.id}`}
              className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
            >
              <ArrowLeft size={16} className="text-neutral-400" />
            </Link>
            <div className="p-2.5 bg-indigo-600/20 border border-indigo-600/30 rounded-xl">
              <Briefcase size={18} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">{project.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-neutral-500 text-xxs font-medium">{client.name}</span>
                <span className="text-neutral-700">•</span>
                <span className={`text-xxs px-2 py-0.5 rounded border font-semibold capitalize ${statusColor}`}>
                  {project.status.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3">
            {[
              { label: "Tasks", value: tasks.length },
              { label: "Milestones", value: milestones.length },
              { label: "Deliverables", value: deliverables.length },
            ].map((s) => (
              <div key={s.label} className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-center min-w-[64px]">
                <p className="text-white text-sm font-bold">{s.value}</p>
                <p className="text-neutral-500 text-xxs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "text-white bg-indigo-600"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {tab.label}
              {tab.key === "tasks" && tasks.filter((t) => t.status !== "done").length > 0 && (
                <span className={`ml-1.5 text-xxs px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === tab.key ? "bg-white/20 text-white" : "bg-neutral-700 text-neutral-300"
                }`}>
                  {tasks.filter((t) => t.status !== "done").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                project={project}
                tasks={tasks}
                milestones={milestones}
                deliverables={deliverables}
                teamMembers={teamMembers}
              />
            )}
            {activeTab === "tasks" && (
              <TasksTab
                projectId={project.id}
                initialTasks={tasks}
                allProfiles={allProfiles}
                canCreate={canCreate}
              />
            )}
            {activeTab === "milestones" && (
              <MilestonesTab
                projectId={project.id}
                initialMilestones={milestones}
                canCreate={canCreate}
              />
            )}
            {activeTab === "deliverables" && (
              <DeliverablesTab
                projectId={project.id}
                initialDeliverables={deliverables}
                milestones={milestones}
                allProfiles={allProfiles}
                canCreate={canCreate}
                canApprove={canApprove}
              />
            )}
            {activeTab === "activity" && (
              <ActivityTab comments={comments} />
            )}
            {activeTab === "team" && (
              <TeamTab members={teamMembers} createdBy={project.created_by} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, CheckCircle, Clock, HeartHandshake, DollarSign,
  Receipt, BellRing, Calendar, ShieldAlert, CheckSquare, List,
  TrendingUp, MessageSquare, ExternalLink, ThumbsUp, ThumbsDown, FileText
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
type Client = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  drive_folder_link: string | null;
  notes: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assignee?: { name: string } | null;
};

type Milestone = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type Deliverable = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  assignee?: { name: string } | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: string;
  issue_date: string;
  due_date: string | null;
};

type Profile = { id: string; name: string };

function fmt(val: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

export default function ClientPortalClient({
  client,
  projects,
  tasks,
  milestones,
  deliverables,
  invoices,
  profile,
}: {
  client: Client;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  profile: Profile;
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "deliverables" | "invoices">("overview");
  const [localDeliverables, setLocalDeliverables] = useState<Deliverable[]>(deliverables);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // ── Stats Calculations ──
  const pendingInvoicesCount = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).length;
  const unpaidInvoicesValue = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.total_amount, 0);
  const activeProjectsCount = projects.filter((p) => p.status === "active").length;
  const activeTasksCount = tasks.filter((t) => t.status !== "done").length;

  async function handleApproveDeliverable(id: string, approve: boolean) {
    setSubmittingId(id);
    const nextStatus = approve ? "approved" : "rejected";
    try {
      const { error } = await supabase
        .from("deliverables")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;
      setLocalDeliverables((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: nextStatus } : d))
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xxs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-900/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Client Portal
          </span>
          <h1 className="text-xl font-bold text-white mt-1.5 tracking-tight">Welcome, {client.contact_person || profile.name}</h1>
          <p className="text-neutral-500 text-xs mt-0.5">Real-time status updates for {client.name}</p>
        </div>
        {client.drive_folder_link && (
          <a
            href={client.drive_folder_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs px-4 py-2 rounded-xl border border-neutral-700 font-semibold transition-all shrink-0"
          >
            <ExternalLink size={13} /> Shared Drive Folder
          </a>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Projects", value: activeProjectsCount, icon: Briefcase, color: "text-indigo-400" },
          { label: "Tasks In Progress", value: activeTasksCount, icon: CheckSquare, color: "text-blue-400" },
          { label: "Pending Invoices", value: pendingInvoicesCount, icon: Receipt, color: "text-yellow-400" },
          { label: "Unpaid Balance", value: fmt(unpaidInvoicesValue), icon: DollarSign, color: "text-emerald-400" },
        ].map((k) => (
          <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">{k.label}</p>
              <p className="text-lg font-bold text-white mt-1">{k.value}</p>
            </div>
            <k.icon size={20} className={k.color} />
          </div>
        ))}
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-1 border-b border-neutral-900">
        {[
          { key: "overview", label: "Overview", count: null },
          { key: "projects", label: "Projects", count: projects.length },
          { key: "deliverables", label: "Deliverables & Approvals", count: localDeliverables.filter(d => d.status === "in_review").length || null },
          { key: "invoices", label: "Invoices", count: invoices.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center gap-2 border-b border-transparent transition-colors -mb-px
              ${activeTab === t.key ? "bg-neutral-900 text-white border-b-indigo-500 border border-neutral-800 border-b-transparent" : "text-neutral-500 hover:text-white"}`}
          >
            {t.label}
            {t.count !== null && (
              <span className="text-xxs bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-bold">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Render Active Tab */}
      <div className="space-y-4">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Project updates */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider">Project Progress</h3>
              <div className="space-y-3">
                {projects.map((project) => {
                  const projTasks = tasks.filter((t) => t.project_id === project.id);
                  const completed = projTasks.filter((t) => t.status === "done").length;
                  const total = projTasks.length;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return (
                    <div key={project.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-white text-sm font-bold">{project.name}</h4>
                          {project.description && (
                            <p className="text-neutral-500 text-xs mt-1">{project.description}</p>
                          )}
                        </div>
                        <span className="text-xxs px-2 py-0.5 rounded border border-indigo-900 bg-indigo-950/60 text-indigo-400 capitalize">
                          {project.status}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xxs text-neutral-400">
                          <span>Progress</span>
                          <span>{percent}% ({completed}/{total} Tasks Completed)</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs italic">
                    No active projects.
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Key Milestones */}
            <div className="space-y-4">
              <h3 className="text-white text-xs font-bold uppercase tracking-wider">Upcoming Milestones</h3>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 divide-y divide-neutral-800/60">
                {milestones.filter(m => m.status !== "completed").slice(0, 5).map((m) => (
                  <div key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="text-white font-semibold truncate">{m.title}</p>
                      <p className="text-neutral-500 text-xxs mt-0.5 capitalize">{m.status.replace("_", " ")}</p>
                    </div>
                    {m.due_date && (
                      <span className="text-neutral-400 text-xxs font-medium flex items-center gap-1 bg-neutral-950 px-2 py-1 rounded-lg">
                        <Calendar size={11} /> {m.due_date}
                      </span>
                    )}
                  </div>
                ))}
                {milestones.filter(m => m.status !== "completed").length === 0 && (
                  <div className="text-center py-6 text-neutral-500 text-xs italic">
                    No upcoming milestones.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="space-y-4">
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.project_id === proj.id);
              const projMilestones = milestones.filter((m) => m.project_id === proj.id);

              return (
                <div key={proj.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-white text-base font-bold">{proj.name}</h3>
                    {proj.description && <p className="text-neutral-500 text-xs mt-1">{proj.description}</p>}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    <p className="text-neutral-400 text-xxs font-bold uppercase tracking-wider">Task List ({projTasks.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {projTasks.map((t) => (
                        <div key={t.id} className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="text-white font-medium truncate">{t.title}</p>
                            {t.assignee && <p className="text-neutral-500 text-xxs mt-0.5">Assignee: {t.assignee.name}</p>}
                          </div>
                          <span className={`text-xxs px-2 py-0.5 rounded border capitalize
                            ${t.status === "done" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones timeline */}
                  <div className="space-y-2">
                    <p className="text-neutral-400 text-xxs font-bold uppercase tracking-wider">Milestones</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {projMilestones.map((m) => (
                        <div key={m.id} className="bg-neutral-950 border border-neutral-850 rounded-xl p-3 min-w-48 text-xs shrink-0">
                          <p className="text-white font-semibold truncate">{m.title}</p>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-neutral-500 text-xxs capitalize">{m.status.replace("_", " ")}</span>
                            {m.due_date && <span className="text-neutral-400 text-xxs font-medium bg-neutral-900 px-1.5 py-0.5 rounded">{m.due_date}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="space-y-3 max-w-4xl">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Pending Review & Assets</h3>
            {localDeliverables.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-neutral-800 rounded-2xl text-neutral-500 text-xs italic">
                No deliverables registered yet.
              </div>
            ) : (
              localDeliverables.map((d) => (
                <div key={d.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className="text-white text-xs font-bold">{d.title}</h4>
                    {d.notes && <p className="text-neutral-500 text-xxs mt-1 leading-relaxed">{d.notes}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xxs text-neutral-600">
                      {d.due_date && <span>Due: {d.due_date}</span>}
                      {d.assignee && <span>Owner: {d.assignee.name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {d.status === "in_review" ? (
                      <>
                        <button
                          disabled={submittingId === d.id}
                          onClick={() => handleApproveDeliverable(d.id, false)}
                          className="flex items-center gap-1 border border-red-900 hover:bg-red-950/40 text-red-400 text-xxs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <ThumbsDown size={11} /> Request Revisions
                        </button>
                        <button
                          disabled={submittingId === d.id}
                          onClick={() => handleApproveDeliverable(d.id, true)}
                          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white-literal text-xxs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-emerald-950/40"
                        >
                          <ThumbsUp size={11} /> Approve Deliverable
                        </button>
                      </>
                    ) : (
                      <span className={`text-xxs px-2.5 py-1 rounded-lg border font-bold capitalize
                        ${d.status === "approved" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : d.status === "rejected" ? "bg-red-950 text-red-400 border-red-900" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="space-y-3 max-w-4xl">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">Invoices & Statements</h3>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden text-xs">
              <div className="grid grid-cols-4 gap-3 bg-neutral-950 p-4 border-b border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider text-xxs">
                <span>Number</span>
                <span>Issue Date</span>
                <span>Amount</span>
                <span className="text-right">Status</span>
              </div>
              <div className="divide-y divide-neutral-800/60">
                {invoices.map((inv) => (
                  <div key={inv.id} className="grid grid-cols-4 gap-3 p-4 items-center">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <FileText size={13} className="text-neutral-500" />
                      {inv.invoice_number}
                    </span>
                    <span className="text-neutral-400">{inv.issue_date}</span>
                    <span className="text-white font-bold">{fmt(inv.total_amount)}</span>
                    <div className="text-right">
                      <span className={`text-xxs px-2 py-0.5 rounded border font-semibold inline-block capitalize
                        ${inv.status === "paid" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : inv.status === "sent" ? "bg-indigo-950 text-indigo-400 border-indigo-900" : inv.status === "overdue" ? "bg-red-950 text-red-400 border-red-900" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                ))}
                {invoices.length === 0 && (
                  <div className="text-center py-8 text-neutral-500 italic">
                    No invoices registered.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

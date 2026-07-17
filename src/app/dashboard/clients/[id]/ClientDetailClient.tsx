"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, X, Calendar, User, DollarSign, ChevronDown, ChevronUp, Users, ArrowLeft, Briefcase, ExternalLink,
  ChevronLeft, ChevronRight, Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, CircleDot, Loader2
} from "lucide-react";
import TaskDetailModal from "@/app/dashboard/components/TaskDetailModal";
import CreateProjectModal from "../CreateProjectModal";
import CreateTaskModal from "@/app/dashboard/tasks/CreateTaskModal";

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

type Client = {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  gst_number: string | null;
  status: string;
  contract_type: string;
  monthly_retainer_value: number;
  start_date: string | null;
  drive_folder_link: string | null;
  notes: string | null;
};

type Project = {
  id: string;
  client_id: string;
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
  description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee?: {
    id: string;
    name: string;
    role: string;
  } | null;
};

type Assignment = {
  id: string;
  client_id: string;
  user_id: string;
  profiles: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member" | "client";
  job_title: string | null;
};

const statusColors: Record<string, string> = {
  active: "bg-green-950 text-green-400 border-green-900",
  paused: "bg-yellow-950 text-yellow-400 border-yellow-900",
  churned: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

const taskStatusColors: Record<string, string> = {
  todo: "bg-neutral-800 text-neutral-400 border-neutral-700",
  in_progress: "bg-indigo-950 text-indigo-400 border-indigo-900",
  review: "bg-purple-950 text-purple-400 border-purple-900",
  done: "bg-green-950 text-green-400 border-green-900",
};

const priorityColors: Record<string, string> = {
  low: "bg-neutral-900 text-neutral-400 border-neutral-800",
  medium: "bg-blue-950/60 text-blue-400 border-blue-900/50",
  high: "bg-red-950/60 text-red-400 border-red-900/50",
};

export default function ClientDetailClient({
  client,
  projects,
  tasks,
  assignments,
  allProfiles,
  currentProfile,
  permissions,
}: {
  client: Client;
  projects: Project[];
  tasks: Task[];
  assignments: Assignment[];
  allProfiles: Profile[];
  currentProfile: Profile;
  permissions: any;
}) {
  const router = useRouter();
  const supabase = createClient();
  const today = new Date();

  // Modals visibility state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client assignments checklist state
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    assignments.map((a) => a.user_id)
  );

  // Expandable projects state
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(
    projects.reduce((acc, p, idx) => ({ ...acc, [p.id]: idx === 0 }), {})
  );

  // Tab view selector
  const [activeViewTab, setActiveViewTab] = useState<"list" | "calendar">("list");

  // Client calendar month navigation state
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  // CSV Import States
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<Array<{
    title: string;
    description?: string;
    projectName: string;
    projectId?: string;
    assigneeName?: string;
    assigneeId?: string;
    priority: string;
    dueDate?: string;
    status: string;
    validation: {
      projectMatch: boolean;
      assigneeMatch: boolean;
    };
  }>>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const eventsByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: Array<Date | null> = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewDate]);

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCsvFile(file);
    setCsvError(null);
    if (!file) {
      setCsvPreview([]);
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      if (lines.length === 0 || !lines[0].trim()) {
        throw new Error("The selected file is empty.");
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
      const requiredFields = ['title'];
      const missingFields = requiredFields.filter(f => !headers.includes(f));
      if (missingFields.length > 0) {
        throw new Error(`Missing required CSV column headers: ${missingFields.join(', ')}. Please verify the header format.`);
      }

      const titleIdx = headers.indexOf('title');
      const descIdx = headers.indexOf('description');
      const projIdx = headers.indexOf('project');
      const assigneeIdx = headers.indexOf('assignee');
      const priorityIdx = headers.indexOf('priority');
      const dueDateIdx = headers.indexOf('due date');
      const statusIdx = headers.indexOf('status');

      const parsedRows: typeof csvPreview = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = [];
        let current = '';
        let inQuotes = false;
        for (let c = 0; c < line.length; c++) {
          const char = line[c];
          if (char === '"' || char === "'") {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^["']|["']$/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/^["']|["']$/g, ''));

        const title = values[titleIdx] || '';
        if (!title) continue;

        const description = descIdx !== -1 ? values[descIdx] : '';
        const projectName = projIdx !== -1 ? values[projIdx] : '';
        const assigneeName = assigneeIdx !== -1 ? values[assigneeIdx] : '';
        const priority = (priorityIdx !== -1 ? values[priorityIdx]?.toLowerCase() : 'medium') || 'medium';
        const rawDueDate = dueDateIdx !== -1 ? values[dueDateIdx] : '';
        const status = (statusIdx !== -1 ? values[statusIdx]?.toLowerCase().replace(' ', '_') : 'todo') || 'todo';

        let matchedProj = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
        let matchedAssignee = allProfiles.find(p => 
          p.name.toLowerCase() === assigneeName.toLowerCase() || 
          p.email.toLowerCase() === assigneeName.toLowerCase()
        );

        let dueDate: string | undefined = undefined;
        if (rawDueDate) {
          const dateTest = new Date(rawDueDate);
          if (!isNaN(dateTest.getTime())) {
            dueDate = dateTest.toISOString().split('T')[0];
          }
        }

        parsedRows.push({
          title,
          description,
          projectName: projectName || "Default Project",
          projectId: matchedProj?.id,
          assigneeName: assigneeName || undefined,
          assigneeId: matchedAssignee?.id,
          priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
          dueDate,
          status: ['todo', 'in_progress', 'review', 'done'].includes(status) ? status : 'todo',
          validation: {
            projectMatch: !!matchedProj,
            assigneeMatch: !assigneeName || !!matchedAssignee
          }
        });
      }

      setCsvPreview(parsedRows);
    } catch (err: any) {
      setCsvError(err.message || "Failed to parse CSV file.");
      setCsvPreview([]);
    }
  };

  const handleConfirmImport = async () => {
    if (csvPreview.length === 0) return;
    setImporting(true);
    setCsvError(null);

    try {
      const uniqueNewProjectNames = Array.from(
        new Set(
          csvPreview
            .filter((row) => !row.projectId)
            .map((row) => row.projectName)
        )
      );

      const projectMap: Record<string, string> = {};
      projects.forEach((p) => {
        projectMap[p.name.toLowerCase()] = p.id;
      });

      for (const newProjName of uniqueNewProjectNames) {
        const { data: newProj, error: projErr } = await supabase
          .from("projects")
          .insert({
            client_id: client.id,
            name: newProjName,
            status: "active",
            created_by: currentProfile.id,
          })
          .select("id, name")
          .single();

        if (projErr) throw projErr;
        if (newProj) {
          projectMap[newProjName.toLowerCase()] = newProj.id;
        }
      }

      const tasksToInsert = csvPreview.map((row) => {
        const projectId = row.projectId || projectMap[row.projectName.toLowerCase()];
        return {
          project_id: projectId,
          title: row.title,
          description: row.description || null,
          assigned_to: row.assigneeId || null,
          priority: row.priority,
          status: row.status,
          due_date: row.dueDate || null,
          created_by: currentProfile.id,
        };
      });

      const { error: tasksErr } = await supabase
        .from("tasks")
        .insert(tasksToInsert);

      if (tasksErr) throw tasksErr;

      setIsCsvModalOpen(false);
      setCsvFile(null);
      setCsvPreview([]);
      setImporting(false);
      
      router.refresh();
      alert(`Import complete! Successfully imported ${tasksToInsert.length} tasks.`);
    } catch (err: any) {
      setCsvError(err.message || "Failed to import tasks from CSV.");
      setImporting(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const isOwnerOrManager =
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  // Update Team Assignments
  async function handleSaveAssignments() {
    setLoading(true);
    setError(null);

    const originalIds = assignments.map((a) => a.user_id);
    const addedIds = selectedAssignees.filter((id) => !originalIds.includes(id));
    const removedIds = originalIds.filter((id) => !selectedAssignees.includes(id));

    try {
      // Execute inserts
      if (addedIds.length > 0) {
        const { error: insertError } = await supabase
          .from("client_assignments")
          .insert(addedIds.map((userId) => ({ client_id: client.id, user_id: userId })));
        if (insertError) throw insertError;
      }

      // Execute deletes
      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("client_assignments")
          .delete()
          .eq("client_id", client.id)
          .in("user_id", removedIds);
        if (deleteError) throw deleteError;
      }

      setIsTeamModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update team assignments.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Clients
        </Link>
      </div>

      {/* Client Overview Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-800">
          <div>
            <h1 className="text-2xl font-bold text-white">{client.name}</h1>
            <p className="text-neutral-500 text-sm mt-1">Client ID: {client.id}</p>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize self-start md:self-center ${
              statusColors[client.status] || "bg-neutral-800 text-neutral-400 border-neutral-700"
            }`}
          >
            {client.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <span className="text-neutral-500 block mb-1">Contact Person</span>
            <span className="text-white font-medium">{client.contact_person || "—"}</span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Email Address</span>
            {client.email ? (
              <a href={`mailto:${client.email}`} className="text-indigo-400 hover:underline">
                {client.email}
              </a>
            ) : (
              <span className="text-white font-medium">—</span>
            )}
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Phone Number</span>
            <span className="text-white font-medium">{client.phone || "—"}</span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Contract Type</span>
            <span className="text-white font-medium capitalize">
              {client.contract_type.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Monthly Retainer</span>
            <div className="flex items-center text-white font-medium">
              <DollarSign size={14} className="text-neutral-500 mr-0.5" />
              <span>
                {client.monthly_retainer_value
                  ? `₹${Number(client.monthly_retainer_value).toLocaleString("en-IN")}`
                  : "0"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-neutral-500 block mb-1">Start Date</span>
            <div className="flex items-center text-white font-medium">
              <Calendar size={14} className="text-neutral-500 mr-1" />
              <span>{client.start_date || "—"}</span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-neutral-500 block mb-1">GST Number</span>
            <span className="text-white font-medium">{client.gst_number || "—"}</span>
          </div>
        </div>
      </div>

      {/* Inline Global Error Banner */}
      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* View Tabs Selector */}
      <div className="flex border-b border-neutral-800 gap-6">
        <button
          onClick={() => setActiveViewTab("list")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeViewTab === "list" ? "text-indigo-400 border-b-2 border-indigo-500 font-semibold" : "text-neutral-500 hover:text-white"
          }`}
        >
          Projects & Tasks List
        </button>
        <button
          onClick={() => setActiveViewTab("calendar")}
          className={`pb-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeViewTab === "calendar" ? "text-indigo-400 border-b-2 border-indigo-500 font-semibold" : "text-neutral-500 hover:text-white"
          }`}
        >
          Client Calendar View
        </button>
      </div>

      {activeViewTab === "list" ? (
        /* Two Column Section: Projects on Left, Team on Right */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Projects & Tasks (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Briefcase size={18} className="text-neutral-400" />
                Projects ({projects.length})
              </h2>
              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-600 text-white-literal text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Plus size={14} />
                Add Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
                No projects created yet for this client. Create a project to start tracking tasks.
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => {
                  const isExpanded = !!expandedProjects[project.id];
                  const projectTasks = tasks.filter((t) => t.project_id === project.id);

                  return (
                    <div
                      key={project.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden transition-all"
                    >
                      {/* Project Header */}
                      <div
                        onClick={() => toggleProject(project.id)}
                        className="p-4 flex items-center justify-between hover:bg-neutral-800/20 cursor-pointer select-none"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className="text-white font-medium text-sm truncate">
                              {project.name}
                            </h3>
                            <span className="text-xxs px-1.5 py-0.5 rounded border border-neutral-700 bg-neutral-800 text-neutral-400 capitalize">
                              {project.status}
                            </span>
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xxs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors shrink-0"
                            >
                              <ExternalLink size={11} />
                              Open Workspace
                            </Link>
                          </div>
                          {project.description && (
                            <p className="text-neutral-500 text-xs mt-1 truncate">
                              {project.description}
                            </p>
                          )}
                          {(project.start_date || project.end_date) && (
                            <div className="flex items-center gap-1 text-neutral-500 text-xxs mt-1.5">
                              <Calendar size={12} />
                              <span>
                                {project.start_date || "—"} to {project.end_date || "—"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 ml-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setSelectedProjectIdForTask(project.id);
                              setIsTaskModalOpen(true);
                            }}
                            className="flex items-center gap-1 border border-neutral-700 hover:border-neutral-500 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xxs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                            Add Task
                          </button>
                          <button
                            onClick={() => toggleProject(project.id)}
                            className="text-neutral-500 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Task Area */}
                      {isExpanded && (
                        <div className="border-t border-neutral-800 bg-neutral-900/50 p-4 space-y-2">
                          {projectTasks.length === 0 ? (
                            <p className="text-neutral-500 text-xs py-2 text-center">
                              No tasks in this project. Click "+ Add Task" to create one.
                            </p>
                          ) : (
                            <div className="divide-y divide-neutral-800/40">
                              {projectTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 text-xs"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">{task.title}</p>
                                    {task.description && (
                                      <p className="text-neutral-500 text-xxs mt-0.5 truncate max-w-lg">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      {task.due_date && (
                                        <span className="text-xxs text-neutral-400 flex items-center gap-0.5">
                                          <Calendar size={10} />
                                          Due {(() => {
                                            const [year, month, day] = task.due_date.split("-").map(Number);
                                            const date = new Date(year, month - 1, day);
                                            return date.toLocaleDateString("en-US", {
                                              weekday: "short",
                                              month: "short",
                                              day: "numeric",
                                            });
                                          })()}
                                        </span>
                                      )}
                                      <span
                                        className={`text-xxs px-1.5 py-0.2 rounded-full border capitalize ${
                                          priorityColors[task.priority] || "border-neutral-700 text-neutral-400"
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                      {task.assignee && (
                                        <span className="text-xxs text-neutral-400 flex items-center gap-1">
                                          <User size={10} className="text-neutral-500" />
                                          {task.assignee.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span
                                    className={`text-xxs px-2 py-0.5 rounded-full border capitalize ${
                                      taskStatusColors[task.status] || "border-neutral-700 text-neutral-400"
                                    }`}
                                  >
                                    {task.status.replace("_", " ")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Assigned Team (1/3 width) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users size={18} className="text-neutral-400" />
                Assigned Team
              </h2>
              {isOwnerOrManager && (
                <button
                  onClick={() => {
                    setSelectedAssignees(assignments.map((a) => a.user_id));
                    setIsTeamModalOpen(true);
                  }}
                  className="border border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-neutral-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Manage
                </button>
              )}
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 divide-y divide-neutral-800">
              {assignments.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-4">
                  No team members assigned to this client.
                </p>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-white text-sm font-medium">
                      {assignment.profiles?.name || "Unknown"}
                    </p>
                    <p className="text-neutral-500 text-xs mt-0.5">
                      {assignment.profiles?.email}
                    </p>
                    <span className="text-xxs px-1.5 py-0.2 rounded border border-neutral-700 bg-neutral-800 text-neutral-400 capitalize mt-1.5 inline-block">
                      {assignment.profiles?.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Calendar View Tab */
        <div className="space-y-4">
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

            {isOwnerOrManager && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCsvModalOpen(true)}
                  className="flex items-center gap-1.5 border border-neutral-700 hover:border-neutral-500 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Upload size={14} className="text-emerald-450" /> Import CSV Tasks
                </button>
                <button
                  onClick={() => {
                    if (projects.length === 0) {
                      alert("Please create a project first before adding tasks.");
                      return;
                    }
                    setSelectedProjectIdForTask(projects[0].id);
                    setIsTaskModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white-literal text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            )}
          </div>

          <div className="bg-neutral-900 border border-neutral-855 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 border-b border-neutral-800 bg-neutral-950/20">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-2.5 text-center text-neutral-500 text-[10px] font-bold uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day, idx) => {
                const key = day ? dateKey(day) : null;
                const dayTasks = key ? (eventsByDay[key] ?? []) : [];
                const isToday = day ? isSameDay(day, today) : false;
                const isCurrentMonth = day ? day.getMonth() === viewDate.getMonth() : false;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (day && isOwnerOrManager) {
                        if (projects.length === 0) {
                          alert("Please create a project first before adding tasks.");
                          return;
                        }
                        const formattedDate = dateKey(day);
                        setSelectedProjectIdForTask(projects[0].id);
                        setIsTaskModalOpen(true);
                      }
                    }}
                    className={`min-h-[105px] p-2 border-b border-r border-neutral-800/40 transition-colors relative select-none
                      ${day ? (isOwnerOrManager ? "cursor-pointer hover:bg-neutral-850/15" : "cursor-default") : "bg-neutral-950/10"}
                      ${idx % 7 === 6 ? "border-r-0" : ""}`}
                  >
                    {day && (
                      <>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xxs font-bold mb-1 mx-auto
                          ${isToday ? "bg-indigo-650 text-white-literal shadow-sm" : isCurrentMonth ? "text-white" : "text-neutral-700"}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayTasks.map((t) => (
                            <button
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskForModal(t);
                              }}
                              className="w-full bg-neutral-955 border border-neutral-800 hover:bg-neutral-800 text-[10px] text-left text-neutral-300 hover:text-white px-2 py-0.5 rounded truncate block transition-colors font-medium cursor-pointer"
                            >
                              {t.title}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PROJECT */}
      <CreateProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        clientId={client.id}
      />

      {/* MODAL 2: ADD TASK */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedProjectIdForTask(null);
        }}
        projects={projects}
        profiles={allProfiles}
        defaultProjectId={selectedProjectIdForTask || undefined}
      />

      {/* MODAL 3: MANAGE TEAM ASSIGNMENTS */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-white font-semibold text-base">Assign Team Members</h2>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-4">
              <p className="text-xs text-neutral-400 mb-2">
                Select which team members are assigned to {client.name}. This controls who can view the client's information based on role permissions.
              </p>
              {allProfiles.map((p) => {
                const isChecked = selectedAssignees.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800/40 cursor-pointer select-none transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedAssignees((prev) =>
                          isChecked
                            ? prev.filter((id) => id !== p.id)
                            : [...prev, p.id]
                        );
                      }}
                      className="mt-0.5 accent-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="text-white font-medium">{p.name}</p>
                      {p.job_title && (
                        <p className="text-neutral-500 text-xxs mt-0.5">{p.job_title}</p>
                      )}
                      <p className="text-neutral-500 text-xxs mt-0.5">{p.email} · <span className="capitalize">{p.role}</span></p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="flex-1 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignments}
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white-literal text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {loading ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4 flex-shrink-0">
              <h2 className="text-white font-semibold text-base flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={18} />
                Bulk Import Tasks via CSV
              </h2>
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                  setCsvError(null);
                }}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4 text-xs">
              <p className="text-neutral-400 leading-relaxed">
                Upload a CSV file containing your client tasks. The CSV must have a header row.
                Required column: <strong className="text-white">Title</strong>. Optional columns: <strong className="text-white">Description, Project, Assignee, Priority, Due Date, Status</strong>.
              </p>

              {/* CSV Template Guidelines */}
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-850">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Column Headers</p>
                <code className="text-xxs text-neutral-300 block bg-neutral-900/60 p-2 rounded overflow-x-auto">
                  Title, Description, Project, Assignee, Priority, Due Date, Status
                </code>
                <p className="text-[9px] text-neutral-550 mt-1">
                  * If Project is specified and doesn't exist, it will be automatically created.
                  * Assignee matches user names/emails. If left empty, it defaults to Unassigned.
                </p>
              </div>

              {/* File Selector */}
              <div className="space-y-1">
                <label className="text-neutral-400 font-semibold block mb-1">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="w-full bg-neutral-955 border border-neutral-800 rounded-lg p-3 text-white file:bg-neutral-850 file:border-none file:text-white file:px-3 file:py-1 file:rounded-md file:text-xxs file:mr-3 hover:file:bg-neutral-750 file:cursor-pointer"
                />
              </div>

              {/* Error banner */}
              {csvError && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{csvError}</span>
                </div>
              )}

              {/* Preview Table */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    Tasks Preview ({csvPreview.length} found)
                  </p>
                  <div className="border border-neutral-800 rounded-lg overflow-x-auto max-h-[220px]">
                    <table className="w-full text-left text-xxs min-w-[600px]">
                      <thead className="bg-neutral-950 text-neutral-500 border-b border-neutral-850 sticky top-0">
                        <tr>
                          <th className="p-2">Task Title</th>
                          <th className="p-2">Project</th>
                          <th className="p-2">Assignee</th>
                          <th className="p-2">Priority</th>
                          <th className="p-2">Due Date</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-855 bg-neutral-950/20">
                        {csvPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-neutral-850/10">
                            <td className="p-2 text-white font-medium truncate max-w-xs">{row.title}</td>
                            <td className="p-2">
                              <span className={`inline-flex items-center gap-1 ${row.validation.projectMatch ? "text-neutral-300" : "text-amber-450"}`}>
                                {!row.validation.projectMatch && <AlertTriangle size={10} />}
                                {row.projectName}
                                {!row.validation.projectMatch && " (New)"}
                              </span>
                            </td>
                            <td className="p-2 text-neutral-300">
                              {row.assigneeName ? (
                                <span className={`inline-flex items-center gap-1 ${row.validation.assigneeMatch ? "text-neutral-300" : "text-red-450"}`}>
                                  {!row.validation.assigneeMatch && <AlertTriangle size={10} />}
                                  {row.assigneeName}
                                  {!row.validation.assigneeMatch && " (No Match)"}
                                </span>
                              ) : (
                                <span className="text-neutral-600 italic">Unassigned</span>
                              )}
                            </td>
                            <td className="p-2 text-neutral-400 capitalize">{row.priority}</td>
                            <td className="p-2 text-neutral-350">{row.dueDate || "—"}</td>
                            <td className="p-2 text-neutral-400 capitalize">{row.status.replace('_', ' ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0 border-t border-neutral-850 pt-3">
              <button
                onClick={() => {
                  setIsCsvModalOpen(false);
                  setCsvFile(null);
                  setCsvPreview([]);
                  setCsvError(null);
                }}
                className="flex-1 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || csvPreview.length === 0}
                className="flex-1 bg-emerald-650 hover:bg-emerald-600 disabled:opacity-50 text-white-literal text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {importing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Confirm & Import ({csvPreview.length} Tasks)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Task Detail Modal */}
      {selectedTaskForModal && (
        <TaskDetailModal
          task={selectedTaskForModal}
          currentProfile={currentProfile}
          allProfiles={allProfiles}
          onClose={() => setSelectedTaskForModal(null)}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

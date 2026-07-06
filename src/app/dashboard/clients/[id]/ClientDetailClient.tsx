"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, X, Calendar, User, DollarSign, ChevronDown, ChevronUp, Users, ArrowLeft, Briefcase, ExternalLink
} from "lucide-react";

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
  role: "owner" | "manager" | "member" | "client";
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

  // Modals visibility state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState<string | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    due_date: "",
  });

  // Client assignments checklist state
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>(
    assignments.map((a) => a.user_id)
  );

  // Expandable projects state
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(
    projects.reduce((acc, p, idx) => ({ ...acc, [p.id]: idx === 0 }), {})
  );

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const isOwnerOrManager = currentProfile.role === "owner" || currentProfile.role === "manager";

  // Create Project
  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: projectError } = await supabase.from("projects").insert({
      client_id: client.id,
      name: projectForm.name,
      description: projectForm.description || null,
      start_date: projectForm.start_date || null,
      end_date: projectForm.end_date || null,
      created_by: currentProfile.id,
    });

    if (projectError) {
      setError(projectError.message);
      setLoading(false);
      return;
    }

    setIsProjectModalOpen(false);
    setProjectForm({ name: "", description: "", start_date: "", end_date: "" });
    setLoading(false);
    router.refresh();
  }

  // Create Task
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectIdForTask) return;

    setLoading(true);
    setError(null);

    const { error: taskError } = await supabase.from("tasks").insert({
      project_id: selectedProjectIdForTask,
      title: taskForm.title,
      description: taskForm.description || null,
      assigned_to: taskForm.assigned_to || null,
      priority: taskForm.priority,
      status: "todo",
      due_date: taskForm.due_date || null,
      created_by: currentProfile.id,
    });

    if (taskError) {
      setError(taskError.message);
      setLoading(false);
      return;
    }

    setIsTaskModalOpen(false);
    setSelectedProjectIdForTask(null);
    setTaskForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
    setLoading(false);
    router.refresh();
  }

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

      {/* Two Column Section: Projects on Left, Team on Right */}
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
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
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
                          className="flex items-center gap-1 border border-neutral-700 hover:border-neutral-500 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xxs px-2.5 py-1.5 rounded-md transition-colors"
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
                                        Due {task.due_date}
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
                className="border border-neutral-700 hover:border-neutral-500 bg-neutral-900 text-neutral-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
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

      {/* MODAL 1: ADD PROJECT */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Add Project</h2>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Project Name *</label>
                <input
                  required
                  placeholder="e.g. Website Redesign"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the project..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Add Task</h2>
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setSelectedProjectIdForTask(null);
                }}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Task Title *</label>
                <input
                  required
                  placeholder="e.g. Setup analytics tracking"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task details..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1">Assignee</label>
                <select
                  value={taskForm.assigned_to}
                  onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
              >
                {loading ? "Creating..." : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}

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
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                {loading ? "Saving..." : "Save Assignments"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

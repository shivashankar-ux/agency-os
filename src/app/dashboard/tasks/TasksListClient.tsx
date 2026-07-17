"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import TaskDetailModal from "@/app/dashboard/components/TaskDetailModal";
import { 
  X, Calendar, User, MessageSquare, Send, Clock, AlertCircle,
  Sparkles, ChevronDown, ChevronUp, Loader2, Check, Copy, Plus, Trash2
} from "lucide-react";
import CreateTaskModal from "./CreateTaskModal";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member" | "client";
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

type Comment = {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles?: {
    name: string;
  } | null;
};

export function getClientColorClass(clientName: string) {
  if (!clientName || clientName === "No Client" || clientName === "Unknown Client") {
    return "bg-neutral-800 text-neutral-400 border-neutral-700";
  }
  const colors = [
    "bg-pink-500/10 text-pink-500 border-pink-500/20",
    "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "bg-amber-500/10 text-amber-500 border-amber-500/20",
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    "bg-violet-500/10 text-violet-400 border-violet-500/20",
    "bg-rose-500/10 text-rose-550 border-rose-500/20",
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

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

export default function TasksListClient({
  tasks,
  currentProfile,
  allProfiles = [],
  allProjects = [],
  allClients = [],
}: {
  tasks: Task[];
  currentProfile: Profile;
  allProfiles?: { id: string; name: string; role: string }[];
  allProjects?: { id: string; name: string; client_id?: string }[];
  allClients?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const { hasPermission } = usePermissions();

  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // State for active task modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Create Task Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for AI Task Copilot
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiPromptType, setAiPromptType] = useState<"strategy" | "caption" | "email" | "seo">("strategy");
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCopied, setAiCopied] = useState(false);
  const [aiPlatform, setAiPlatform] = useState("LinkedIn");
  const [aiTone, setAiTone] = useState("Professional");

  const canUseAI =
    hasPermission("ai", "proposal_generator") ||
    hasPermission("ai", "marketing_ai") ||
    hasPermission("ai", "caption_generator") ||
    hasPermission("ai", "reports_ai");

  // Fetch comments when a task is selected
  useEffect(() => {
    if (!selectedTask) {
      setComments([]);
      setAiOutput("");
      setAiExpanded(false);
      return;
    }

    async function fetchComments() {
      setCommentsLoading(true);
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, profiles(name)")
        .eq("task_id", selectedTask!.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setComments(data as Comment[]);
      }
      setCommentsLoading(false);
    }

    fetchComments();
  }, [selectedTask, supabase]);

  // Handle status update
  async function handleStatusChange(newStatus: string) {
    if (!selectedTask) return;
    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", selectedTask.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Update local modal state
    setSelectedTask({
      ...selectedTask,
      status: newStatus,
    });
    setLoading(false);
    router.refresh();
  }

  // Handle direct task deletion (Optimistic)
  async function handleDeleteTaskDirect(id: string) {
    setLocalTasks((prev) => prev.filter((t) => t.id !== id));

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (deleteError) {
      alert(`Failed to delete task: ${deleteError.message}`);
      router.refresh();
      return;
    }

    router.refresh();
  }

  // Handle post comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTask || !commentText.trim()) return;

    setLoading(true);
    setError(null);

    const { data: newCommentData, error: commentError } = await supabase
      .from("task_comments")
      .insert({
        task_id: selectedTask.id,
        user_id: currentProfile.id,
        comment: commentText.trim(),
      })
      .select("*, profiles(name)")
      .single();

    if (commentError) {
      setError(commentError.message);
      setLoading(false);
      return;
    }

    if (newCommentData) {
      setComments((prev) => [...prev, newCommentData as Comment]);
    }
    setCommentText("");
    setLoading(false);
    router.refresh();
  }

  // AI Task Copilot generator handler
  async function handleAIGenerate() {
    if (!selectedTask) return;
    setAiLoading(true);
    setAiOutput("");
    setAiCopied(false);

    let params = {};
    const clientName = selectedTask.projects?.clients?.name || "Client";
    const projectName = selectedTask.projects?.name || "Project";
    const taskTitle = selectedTask.title;
    const taskDesc = selectedTask.description || "Task details";

    if (aiPromptType === "strategy") {
      params = {
        productName: taskTitle,
        targetAudience: `Target segment for ${clientName}`,
        goal: `Successfully complete: ${taskDesc}`,
        channels: "Omnichannel (Social, Web, Email)",
      };
    } else if (aiPromptType === "caption") {
      params = {
        platform: aiPlatform,
        topic: taskTitle,
        tone: aiTone,
        cta: `Learn more about our work on ${projectName}`,
      };
    } else if (aiPromptType === "email") {
      params = {
        recipientName: clientName,
        subject: `Update on Task: ${taskTitle}`,
        points: `We are making progress on "${taskTitle}" under project "${projectName}". Key details:\n- ${taskDesc}`,
      };
    } else if (aiPromptType === "seo") {
      params = {
        keywords: `${taskTitle.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, ", ")}`,
        pageTopic: `${taskTitle} - ${taskDesc}`,
        intent: "Informational",
      };
    }

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptType: aiPromptType, params }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate text");
      setAiOutput(data.content);
    } catch (err: any) {
      alert(err.message || "Something went wrong during generation");
    } finally {
      setAiLoading(false);
    }
  }

  // Post AI content directly to comment section
  async function handlePostAICopyAsComment(text: string) {
    if (!selectedTask || !text.trim()) return;

    setLoading(true);
    setError(null);

    const { data: newCommentData, error: commentError } = await supabase
      .from("task_comments")
      .insert({
        task_id: selectedTask.id,
        user_id: currentProfile.id,
        comment: `✨ **AI Task Copilot Output (${aiPromptType.toUpperCase()}):**\n\n${text.trim()}`,
      })
      .select("*, profiles(name)")
      .single();

    if (commentError) {
      setError(commentError.message);
      setLoading(false);
      return;
    }

    if (newCommentData) {
      setComments((prev) => [...prev, newCommentData as Comment]);
    }
    setLoading(false);
    router.refresh();
  }

  // Check if current user is authorized to edit the task status
  const canUpdateStatus =
    selectedTask?.assigned_to === currentProfile.id ||
    currentProfile.role === "owner" ||
    currentProfile.role === "manager";

  const canCreateTasks =
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  const canDeleteTasks =
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  return (
    <div className="space-y-4">
      {canCreateTasks && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white-literal px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Task
          </button>
        </div>
      )}

      {/* Task List Grid */}
      {localTasks.length === 0 ? (
        <div className="card-glass rounded-2xl p-10 text-center">
          <p className="text-neutral-500 text-sm">
            No tasks yet. Tasks live under projects — add a client and project first, then tasks.
          </p>
        </div>
      ) : (
        <div className="card-glass rounded-2xl divide-y divide-neutral-800/40 overflow-hidden">
          {localTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setError(null);
              }}
              className="p-4 flex items-center justify-between hover:bg-neutral-850/10 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-white text-sm font-bold truncate">{task.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-neutral-500 text-xs mt-1.5">
                  <span className="flex items-center gap-1.5 truncate">
                    {task.projects?.clients?.name ? (
                      <span className={`inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${getClientColorClass(task.projects.clients.name)}`}>
                        {task.projects.clients.name}
                      </span>
                    ) : (
                      <span className="inline-block border text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-neutral-850 text-neutral-500 border-neutral-800 shrink-0">
                        No Client
                      </span>
                    )}
                    <span className="text-neutral-400 font-semibold">{task.projects?.name}</span>
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1 font-semibold text-neutral-500">
                      <Calendar size={12} className="text-neutral-600" />
                      {(() => {
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
                  {task.assignee && (
                    <span className="flex items-center gap-1 text-neutral-400 font-semibold">
                      <User size={12} className="text-neutral-500" />
                      {task.assignee.name}
                    </span>
                  )}
                  {!task.assignee && (
                    <span className="text-neutral-600 italic">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xxs px-2.5 py-0.5 rounded-full border capitalize font-semibold ${
                    priorityColors[task.priority] || "border-neutral-700 text-neutral-450"
                  }`}
                >
                  {task.priority}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border capitalize font-semibold ${
                    taskStatusColors[task.status] || "border-neutral-700 text-neutral-450"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
                {canDeleteTasks && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) {
                        await handleDeleteTaskDirect(task.id);
                      }
                    }}
                    className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 ml-1"
                    title="Delete Task"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentProfile={currentProfile}
          allProfiles={allProfiles}
          allProjects={allProjects}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => router.refresh()}
        />
      )}

      {/* MODAL 3: CREATE TASK */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={allProjects}
        profiles={allProfiles}
        clients={allClients}
      />
    </div>
  );
}

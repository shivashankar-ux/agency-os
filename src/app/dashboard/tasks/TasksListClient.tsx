"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import { 
  X, Calendar, User, MessageSquare, Send, Clock, AlertCircle,
  Sparkles, ChevronDown, ChevronUp, Loader2, Check, Copy
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "member" | "client";
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
}: {
  tasks: Task[];
  currentProfile: Profile;
}) {
  const router = useRouter();
  const supabase = createClient();

  const { hasPermission } = usePermissions();

  // State for active task modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-4">
      {/* Task List Grid */}
      {tasks.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-500 text-sm">
            No tasks yet. Tasks live under projects — add a client and project first, then tasks.
          </p>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setError(null);
              }}
              className="p-4 flex items-center justify-between hover:bg-neutral-800/35 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-white text-sm font-medium truncate">{task.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-neutral-500 text-xs mt-1">
                  <span className="truncate">
                    {task.projects?.clients?.name} · {task.projects?.name}
                  </span>
                  {task.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-neutral-600" />
                      {task.due_date}
                    </span>
                  )}
                  {task.assignee && (
                    <span className="flex items-center gap-1 text-neutral-400">
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
                  className={`text-xxs px-2 py-0.5 rounded-full border capitalize ${
                    priorityColors[task.priority] || "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {task.priority}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                    taskStatusColors[task.status] || "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider block">
                  {selectedTask.projects?.clients?.name} / {selectedTask.projects?.name}
                </span>
                <h2 className="text-white text-lg font-bold mt-0.5 truncate max-w-lg">
                  {selectedTask.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable Grid */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Task Fields Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl text-sm">
                <div>
                  <span className="text-neutral-500 block text-xs">Assignee</span>
                  <span className="text-white font-medium flex items-center gap-1 mt-1">
                    <User size={14} className="text-neutral-500" />
                    {selectedTask.assignee?.name || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">Priority</span>
                  <span className="text-white font-medium capitalize flex items-center gap-1 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedTask.priority === "high"
                          ? "bg-red-500"
                          : selectedTask.priority === "medium"
                          ? "bg-blue-500"
                          : "bg-neutral-500"
                      }`}
                    />
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs">Due Date</span>
                  <span className="text-white font-medium flex items-center gap-1 mt-1">
                    <Calendar size={14} className="text-neutral-500" />
                    {selectedTask.due_date || "No due date"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-xs mb-1">Status</span>
                  {canUpdateStatus ? (
                    <select
                      value={selectedTask.status}
                      disabled={loading}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span className="text-white font-medium capitalize mt-1 inline-block">
                      {selectedTask.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mb-1.5">
                  Description
                </h3>
                <div className="text-neutral-300 text-sm whitespace-pre-wrap bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/40">
                  {selectedTask.description || "No description provided."}
                </div>
              </div>

              {/* AI Task Copilot Panel */}
              {canUseAI && (
                <div className="border border-neutral-800 bg-neutral-950/40 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setAiExpanded(!aiExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/60 hover:bg-neutral-900 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold">
                      <Sparkles size={16} className="animate-pulse" />
                      <span>AI Task Copilot</span>
                    </div>
                    <span className="text-neutral-500">
                      {aiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {aiExpanded && (
                    <div className="p-4 space-y-4 border-t border-neutral-800/80">
                      {/* Generation Type Selection */}
                      <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                        {[
                          { id: "strategy", label: "Breakdown" },
                          { id: "caption", label: "Caption" },
                          { id: "email", label: "Email" },
                          { id: "seo", label: "SEO Plan" },
                        ].map((type) => (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => {
                              setAiPromptType(type.id as any);
                              setAiOutput("");
                            }}
                            className={`flex-1 text-center py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                              aiPromptType === type.id
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-neutral-400 hover:text-white"
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom inputs if caption selected */}
                      {aiPromptType === "caption" && (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-neutral-400 block mb-1">Platform</label>
                            <select
                              value={aiPlatform}
                              onChange={(e) => setAiPlatform(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-md p-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="LinkedIn">LinkedIn</option>
                              <option value="Instagram">Instagram</option>
                              <option value="Twitter">X / Twitter</option>
                              <option value="Facebook">Facebook</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-neutral-400 block mb-1">Tone</label>
                            <select
                              value={aiTone}
                              onChange={(e) => setAiTone(e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-md p-1.5 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            >
                              <option value="Professional">Professional</option>
                              <option value="Witty/Creative">Witty / Creative</option>
                              <option value="Informative">Informative</option>
                              <option value="Casual">Casual</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={handleAIGenerate}
                        className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Generating draft...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Run Generative Copilot</span>
                          </>
                        )}
                      </button>

                      {/* AI Output Window */}
                      {(aiOutput || aiLoading) && (
                        <div className="space-y-2 mt-3">
                          <label className="text-neutral-400 text-xxs font-bold uppercase tracking-wider block">
                            Generated Output
                          </label>
                          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                            {aiLoading ? (
                              <div className="flex flex-col items-center justify-center py-6 text-neutral-500 gap-2">
                                <Loader2 size={20} className="animate-spin text-indigo-450" />
                                <span className="text-xs">Processing prompt...</span>
                              </div>
                            ) : (
                              <div className="text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                                {aiOutput}
                              </div>
                            )}
                          </div>

                          {!aiLoading && aiOutput && (
                            <div className="flex gap-2">
                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(aiOutput);
                                  setAiCopied(true);
                                  setTimeout(() => setAiCopied(false), 2000);
                                }}
                                className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              >
                                {aiCopied ? (
                                  <>
                                    <Check size={12} className="text-green-400" />
                                    <span className="text-green-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy Draft</span>
                                  </>
                                )}
                              </button>

                              {/* Post as Comment Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  handlePostAICopyAsComment(aiOutput);
                                  alert("Success! The AI generation has been posted as a comment on this task.");
                                }}
                                className="flex-1 py-1.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-indigo-400 rounded-md text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                              >
                                <MessageSquare size={12} />
                                <span>Save as Comment</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Error messages */}
              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-3">
                <h3 className="text-xs text-neutral-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={14} />
                  Comments ({comments.length})
                </h3>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    required
                    disabled={loading}
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3.5 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !commentText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Comments List */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {commentsLoading ? (
                    <div className="text-center py-4 text-xs text-neutral-500">
                      Loading comments...
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-neutral-500 text-xs italic text-center py-4">
                      No comments yet. Start the conversation.
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-neutral-950/70 p-3 rounded-lg border border-neutral-800/60"
                      >
                        <div className="flex items-center justify-between text-xxs mb-1.5">
                          <span className="text-white font-semibold">
                            {comment.profiles?.name || "Unknown Team Member"}
                          </span>
                          <span className="text-neutral-500 flex items-center gap-0.5">
                            <Clock size={10} />
                            {new Date(comment.created_at).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-neutral-300 text-xs">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

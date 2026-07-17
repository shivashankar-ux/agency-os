"use client";

import { useState, useEffect, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import {
  X, Calendar, User, MessageSquare, Send, Clock, AlertCircle,
  Sparkles, ChevronDown, ChevronUp, Loader2, Check, Copy, Trash2
} from "lucide-react";
import { getClientColorClass } from "@/app/dashboard/calendar/CalendarPageClient";

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

interface TaskDetailModalProps {
  task: Task;
  currentProfile: Profile;
  allProfiles: { id: string; name: string; role: string }[];
  allProjects?: { id: string; name: string }[];
  onClose: () => void;
  onUpdate: () => void;
}

const taskStatusColors: Record<string, string> = {
  todo: "bg-neutral-800 text-neutral-400 border-neutral-700",
  in_progress: "bg-indigo-950 text-indigo-400 border-indigo-900",
  review: "bg-purple-950 text-purple-400 border-purple-900",
  done: "bg-green-950 text-green-400 border-green-900",
};

export default function TaskDetailModal({
  task,
  currentProfile,
  allProfiles,
  allProjects = [],
  onClose,
  onUpdate,
}: TaskDetailModalProps) {
  const supabase = createClient();
  const { hasPermission } = usePermissions();

  const [localTask, setLocalTask] = useState<Task>(task);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Description edit state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(task.description || "");

  // AI Task Copilot State
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

  useEffect(() => {
    setLocalTask(task);
    setDescriptionValue(task.description || "");
  }, [task]);

  // Fetch comments
  useEffect(() => {
    async function fetchComments() {
      setCommentsLoading(true);
      const { data, error: commentsErr } = await supabase
        .from("task_comments")
        .select("*, profiles(name)")
        .eq("task_id", task.id)
        .order("created_at", { ascending: true });

      if (!commentsErr && data) {
        setComments(data as Comment[]);
      }
      setCommentsLoading(false);
    }
    fetchComments();
  }, [task.id, supabase]);

  // Handle status update
  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", localTask.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLocalTask((prev) => ({ ...prev, status: newStatus }));
    setLoading(false);
    onUpdate();
  }

  // Handle assignee change
  async function handleAssigneeChange(newAssigneeId: string) {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ assigned_to: newAssigneeId || null, updated_at: new Date().toISOString() })
      .eq("id", localTask.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const matchedAssignee = allProfiles.find((p) => p.id === newAssigneeId) || null;
    setLocalTask((prev) => ({
      ...prev,
      assigned_to: newAssigneeId || null,
      assignee: matchedAssignee ? { id: matchedAssignee.id, name: matchedAssignee.name, role: matchedAssignee.role } : null
    }));
    setLoading(false);
    onUpdate();
  }

  // Handle due date change
  async function handleDueDateChange(newDueDate: string) {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ due_date: newDueDate || null, updated_at: new Date().toISOString() })
      .eq("id", localTask.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLocalTask((prev) => ({ ...prev, due_date: newDueDate || null }));
    setLoading(false);
    onUpdate();
  }

  // Save description
  async function handleSaveDescription() {
    setLoading(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("tasks")
      .update({ description: descriptionValue.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", localTask.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLocalTask((prev) => ({ ...prev, description: descriptionValue.trim() || null }));
    setIsEditingDescription(false);
    setLoading(false);
    onUpdate();
  }

  // Handle post comment
  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoading(true);
    setError(null);

    const { data: newCommentData, error: commentError } = await supabase
      .from("task_comments")
      .insert({
        task_id: localTask.id,
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
    onUpdate();
  }

  // AI Task Copilot generator handler
  async function handleAIGenerate() {
    setAiLoading(true);
    setAiOutput("");
    setAiCopied(false);

    const clientName = localTask.projects?.clients?.name || "Client";
    const projectName = localTask.projects?.name || "Project";
    const taskTitle = localTask.title;
    const taskDesc = localTask.description || "Task details";

    let params = {};
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

  async function handlePostAICopyAsComment(text: string) {
    setLoading(true);
    setError(null);

    const { data: newCommentData, error: commentError } = await supabase
      .from("task_comments")
      .insert({
        task_id: localTask.id,
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
    onUpdate();
  }

  async function handleDeleteTask() {
    if (!window.confirm("Are you sure you want to permanently delete this task?")) return;

    setLoading(true);
    setError(null);

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", localTask.id);

    if (deleteError) {
      setError(deleteError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
    onUpdate();
  }

  const canUpdateStatus =
    localTask.assigned_to === currentProfile.id ||
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  const isOwnerOrManager =
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  const canDeleteTask =
    currentProfile.role === "owner" ||
    currentProfile.role === "admin" ||
    currentProfile.role === "manager";

  const clientName = localTask.projects?.clients?.name || "";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-neutral-500 text-xs font-semibold uppercase tracking-wider block">
              {clientName ? `${clientName} / ` : ""}{localTask.projects?.name || "No Linked Project"}
            </span>
            <h2 className="text-white text-lg font-bold mt-0.5 truncate max-w-lg">
              {localTask.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {canDeleteTask && (
              <button
                onClick={handleDeleteTask}
                disabled={loading}
                className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors mr-1 cursor-pointer"
                title="Delete Task"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Info Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-950 p-4 border border-neutral-800/80 rounded-xl text-xs">
            <div>
              <span className="text-neutral-500 block">Assignee</span>
              {isOwnerOrManager ? (
                <select
                  value={localTask.assigned_to || ""}
                  disabled={loading}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="mt-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-white focus:outline-none w-full"
                >
                  <option value="">Unassigned</option>
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-white font-medium flex items-center gap-1 mt-1.5">
                  <User size={14} className="text-neutral-500" />
                  {localTask.assignee?.name || "Unassigned"}
                </span>
              )}
            </div>
            <div>
              <span className="text-neutral-500 block">Priority</span>
              <span className="text-white font-medium capitalize flex items-center gap-1.5 mt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    localTask.priority === "high"
                      ? "bg-red-500 animate-pulse"
                      : localTask.priority === "medium"
                      ? "bg-blue-500"
                      : "bg-neutral-550"
                  }`}
                />
                {localTask.priority}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block">Due Date</span>
              {isOwnerOrManager ? (
                <input
                  type="date"
                  value={localTask.due_date || ""}
                  disabled={loading}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="mt-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-white focus:outline-none w-full font-sans"
                />
              ) : (
                <span className="text-white font-medium flex items-center gap-1 mt-2">
                  <Calendar size={14} className="text-neutral-500" />
                  {localTask.due_date ? (() => {
                    const [year, month, day] = localTask.due_date.split("-").map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                  })() : "No due date"}
                </span>
              )}
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Status</span>
              {canUpdateStatus ? (
                <select
                  value={localTask.status}
                  disabled={loading}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <span
                  className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border capitalize font-semibold ${
                    taskStatusColors[localTask.status] || "border-neutral-700 text-neutral-400"
                  }`}
                >
                  {localTask.status.replace("_", " ")}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">
                Description
              </h3>
              {isOwnerOrManager && !isEditingDescription && (
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="text-xxs text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-neutral-700 resize-none font-sans"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setDescriptionValue(localTask.description || "");
                      setIsEditingDescription(false);
                    }}
                    className="text-xxs border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    disabled={loading}
                    className="text-xxs bg-indigo-600 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-white-literal font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-neutral-300 text-sm whitespace-pre-wrap bg-neutral-950/40 p-3 rounded-lg border border-neutral-800/40">
                {localTask.description || "No description provided."}
              </div>
            )}
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
                            ? "bg-indigo-600 text-white-literal shadow-sm"
                            : "text-neutral-400 hover:text-white"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  {aiPromptType === "caption" && (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-neutral-400 block mb-1">Platform</label>
                        <select
                          value={aiPlatform}
                          onChange={(e) => setAiPlatform(e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md p-1.5 text-white focus:outline-none"
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
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-md p-1.5 text-white focus:outline-none"
                        >
                          <option value="Professional">Professional</option>
                          <option value="Witty/Creative">Witty / Creative</option>
                          <option value="Informative">Informative</option>
                          <option value="Casual">Casual</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={handleAIGenerate}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-600 text-white-literal rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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

                  {(aiOutput || aiLoading) && (
                    <div className="space-y-2 mt-3">
                      <label className="text-neutral-400 text-xxs font-bold uppercase tracking-wider block">
                        Generated Output
                      </label>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                        {aiLoading ? (
                          <div className="flex flex-col items-center justify-center py-6 text-neutral-500 gap-2">
                            <Loader2 size={20} className="animate-spin text-indigo-450" />
                            <span className="text-xs">Processing...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                            {aiOutput}
                          </div>
                        )}
                      </div>

                      {!aiLoading && aiOutput && (
                        <div className="flex gap-2">
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

          {/* Error Banner */}
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
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white-literal p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>

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
  );
}

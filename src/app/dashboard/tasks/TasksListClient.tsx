"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  X, Calendar, User, MessageSquare, Send, Clock, AlertCircle 
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

  // State for active task modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments when a task is selected
  useEffect(() => {
    if (!selectedTask) {
      setComments([]);
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

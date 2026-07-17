"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Calendar, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to: string | null;
  assignee?: { id: string; name: string } | null;
}

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface TasksTabProps {
  projectId: string;
  initialTasks: Task[];
  allProfiles: Profile[];
  canCreate: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "To Do", color: "bg-neutral-800 text-neutral-400 border-neutral-700" },
  in_progress: { label: "In Progress", color: "bg-indigo-950 text-indigo-400 border-indigo-900" },
  review: { label: "Review", color: "bg-purple-950 text-purple-400 border-purple-900" },
  done: { label: "Done", color: "bg-emerald-950 text-emerald-400 border-emerald-900" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "text-neutral-400" },
  medium: { label: "Medium", color: "text-blue-400" },
  high: { label: "High", color: "text-red-400" },
};

export default function TasksTab({ projectId, initialTasks, allProfiles, canCreate }: TasksTabProps) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: "todo",
    due_date: "",
  });

  const filtered = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: projectId,
          title: formData.title,
          description: formData.description || null,
          assigned_to: formData.assigned_to || null,
          priority: formData.priority,
          status: formData.status,
          due_date: formData.due_date || null,
        })
        .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name)")
        .single();

      if (error) throw error;
      setTasks((prev) => [data as Task, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", description: "", assigned_to: "", priority: "medium", status: "todo", due_date: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await supabase.from("tasks").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", taskId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    } catch {}
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Filter + Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800/80 p-1 rounded-lg overflow-x-auto">
          {["all", "todo", "in_progress", "review", "done"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-xxs font-semibold rounded-md whitespace-nowrap capitalize transition-all ${
                statusFilter === s ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"
              }`}
            >
              {s === "all" ? "All" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white-literal px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
          >
            <Plus size={14} /> Add Task
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-neutral-500 text-xs italic border border-dashed border-neutral-800 rounded-xl">
            No tasks found. {canCreate && 'Click “Add Task” to create one.'}
          </div>
        ) : (
          filtered.map((task, index) => {
            const sc = statusConfig[task.status] || statusConfig.todo;
            const pc = priorityConfig[task.priority] || priorityConfig.medium;
            const isOverdue = task.due_date && task.due_date < today && task.status !== "done";

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-neutral-750 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`text-xxs px-2 py-0.5 rounded border font-semibold bg-neutral-950 focus:outline-none shrink-0 ${sc.color}`}
                  >
                    {Object.entries(statusConfig).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold truncate ${task.status === "done" ? "line-through text-neutral-500" : "text-white"}`}>
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p className="text-neutral-500 text-xxs mt-0.5 flex items-center gap-1">
                        <User size={10} /> {task.assignee.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xxs font-semibold ${pc.color}`}>{pc.label}</span>
                  {task.due_date && (
                    <span className={`text-xxs flex items-center gap-1 font-medium ${isOverdue ? "text-red-400" : "text-neutral-500"}`}>
                      <Calendar size={11} />
                      {task.due_date}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider">New Task</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Task Title *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Design homepage wireframe"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Optional details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Assign To</label>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    >
                      <option value="">Unassigned</option>
                      {allProfiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Initial Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    >
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Due Date</label>
                    <input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-neutral-850">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg py-2 font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal rounded-lg py-2 font-semibold transition-colors">
                    {submitting ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

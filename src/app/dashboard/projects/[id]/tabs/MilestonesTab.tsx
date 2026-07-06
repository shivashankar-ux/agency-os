"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Calendar, CheckCircle, Clock, AlertTriangle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

interface MilestonesTabProps {
  projectId: string;
  initialMilestones: Milestone[];
  canCreate: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Circle, color: "text-neutral-400", bg: "bg-neutral-800 border-neutral-700" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-indigo-400", bg: "bg-indigo-950 border-indigo-900" },
  completed: { label: "Completed", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-900" },
  overdue: { label: "Overdue", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-950 border-red-900" },
};

export default function MilestonesTab({ projectId, initialMilestones, canCreate }: MilestonesTabProps) {
  const supabase = createClient();
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", due_date: "", status: "pending" });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("milestones")
        .insert({
          project_id: projectId,
          title: formData.title,
          description: formData.description || null,
          due_date: formData.due_date || null,
          status: formData.status,
        })
        .select()
        .single();

      if (error) throw error;
      setMilestones((prev) => [data as Milestone, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", description: "", due_date: "", status: "pending" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await supabase.from("milestones").update({ status }).eq("id", id);
      setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
          {milestones.length} Milestone{milestones.length !== 1 ? "s" : ""}
        </p>
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          >
            <Plus size={14} /> Add Milestone
          </button>
        )}
      </div>

      {/* Timeline-style list */}
      <div className="relative border-l-2 border-neutral-800 ml-3 space-y-0">
        {milestones.length === 0 ? (
          <div className="ml-6 py-8 text-center text-neutral-500 text-xs italic border border-dashed border-neutral-800 rounded-xl">
            No milestones yet. {canCreate && 'Click “Add Milestone” to start planning.'}
          </div>
        ) : (
          milestones.map((m, index) => {
            const sc = statusConfig[m.status] || statusConfig.pending;
            const Icon = sc.icon;
            const today = new Date().toISOString().split("T")[0];
            const isLate = m.due_date && m.due_date < today && m.status !== "completed";

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative ml-6 pb-6"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-[33px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${sc.bg}`}>
                  <Icon size={9} className={sc.color} />
                </div>

                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-750 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white text-xs font-semibold">{m.title}</h4>
                      {m.description && (
                        <p className="text-neutral-500 text-xxs mt-1 leading-relaxed">{m.description}</p>
                      )}
                      {m.due_date && (
                        <div className={`flex items-center gap-1 mt-2 text-xxs font-medium ${isLate ? "text-red-400" : "text-neutral-500"}`}>
                          <Calendar size={11} />
                          Due {m.due_date}
                          {isLate && <span className="ml-1 text-red-400 font-bold">• OVERDUE</span>}
                        </div>
                      )}
                    </div>
                    <select
                      value={m.status}
                      onChange={(e) => handleStatusChange(m.id, e.target.value)}
                      className={`text-xxs px-2 py-1 rounded-lg border font-semibold bg-neutral-950 focus:outline-none shrink-0 ${sc.bg} ${sc.color}`}
                    >
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider">New Milestone</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Milestone Title *</label>
                  <input type="text" required placeholder="e.g. Phase 1 Design Complete"
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Description</label>
                  <textarea rows={2} placeholder="What does this milestone achieve?"
                    value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Due Date</label>
                    <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Initial Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                    >
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-neutral-850">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg py-2 font-semibold transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg py-2 font-semibold transition-colors">
                    {submitting ? "Saving..." : "Save Milestone"}
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

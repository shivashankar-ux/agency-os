"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Calendar, CheckCircle, Clock, ThumbsDown, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "@/components/ui/DatePicker";

interface Deliverable {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  notes: string | null;
  assigned_to: string | null;
  milestone_id: string | null;
  assignee?: { name: string } | null;
}

interface Milestone {
  id: string;
  title: string;
}

interface Profile {
  id: string;
  name: string;
}

interface DeliverablesTabProps {
  projectId: string;
  initialDeliverables: Deliverable[];
  milestones: Milestone[];
  allProfiles: Profile[];
  canCreate: boolean;
  canApprove: boolean;
}

const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-neutral-400", bg: "bg-neutral-800 border-neutral-700" },
  in_review: { label: "In Review", icon: Eye, color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-900" },
  approved: { label: "Approved", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-950 border-emerald-900" },
  rejected: { label: "Rejected", icon: ThumbsDown, color: "text-red-400", bg: "bg-red-950 border-red-900" },
};

export default function DeliverablesTab({ projectId, initialDeliverables, milestones, allProfiles, canCreate, canApprove }: DeliverablesTabProps) {
  const supabase = createClient();
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialDeliverables);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "", notes: "", due_date: "", assigned_to: "", milestone_id: "", status: "pending"
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("deliverables")
        .insert({
          project_id: projectId,
          title: formData.title,
          notes: formData.notes || null,
          due_date: formData.due_date || null,
          assigned_to: formData.assigned_to || null,
          milestone_id: formData.milestone_id || null,
          status: formData.status,
        })
        .select("*, assignee:profiles!deliverables_assigned_to_fkey(name)")
        .single();

      if (error) throw error;
      setDeliverables((prev) => [data as Deliverable, ...prev]);
      setIsModalOpen(false);
      setFormData({ title: "", notes: "", due_date: "", assigned_to: "", milestone_id: "", status: "pending" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await supabase.from("deliverables").update({ status }).eq("id", id);
      setDeliverables((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
    } catch {}
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">
          {deliverables.filter((d) => d.status === "approved").length} / {deliverables.length} Approved
        </p>
        {canCreate && (
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white-literal px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
            <Plus size={14} /> Add Deliverable
          </button>
        )}
      </div>

      <div className="space-y-2">
        {deliverables.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs italic border border-dashed border-neutral-800 rounded-xl">
            No deliverables yet. {canCreate && 'Click "Add Deliverable" to create one.'}
          </div>
        ) : (
          deliverables.map((d, index) => {
            const sc = statusConfig[d.status] || statusConfig.pending;
            const Icon = sc.icon;
            const isLate = d.due_date && d.due_date < today && d.status !== "approved";
            const milestone = milestones.find((m) => m.id === d.milestone_id);

            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-750 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg border shrink-0 ${sc.bg}`}>
                      <Icon size={13} className={sc.color} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white text-xs font-semibold truncate">{d.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {d.assignee && (
                          <span className="text-neutral-500 text-xxs">{d.assignee.name}</span>
                        )}
                        {milestone && (
                          <span className="text-indigo-400 text-xxs bg-indigo-950 border border-indigo-900 px-1.5 py-0.2 rounded">
                            {milestone.title}
                          </span>
                        )}
                        {d.due_date && (
                          <span className={`text-xxs flex items-center gap-1 ${isLate ? "text-red-400" : "text-neutral-500"}`}>
                            <Calendar size={10} /> {d.due_date}
                          </span>
                        )}
                      </div>
                      {d.notes && <p className="text-neutral-500 text-xxs mt-1">{d.notes}</p>}
                    </div>
                  </div>
                  {(canApprove || canCreate) ? (
                    <select value={d.status} onChange={(e) => handleStatusChange(d.id, e.target.value)}
                      className={`text-xxs px-2 py-1 rounded-lg border font-semibold bg-neutral-950 focus:outline-none shrink-0 ${sc.bg} ${sc.color}`}>
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  ) : (
                    <span className={`text-xxs px-2 py-0.5 rounded border font-semibold shrink-0 ${sc.bg} ${sc.color}`}>
                      {sc.label}
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
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-4 mb-4">
                <h3 className="text-white text-sm font-bold uppercase tracking-wider">New Deliverable</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Deliverable Title *</label>
                  <input type="text" required placeholder="e.g. Homepage mockup v2"
                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Linked Milestone</label>
                    <select value={formData.milestone_id} onChange={(e) => setFormData({ ...formData, milestone_id: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700">
                      <option value="">No Milestone</option>
                      {milestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Assign To</label>
                    <select value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700">
                      <option value="">Unassigned</option>
                      {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Due Date</label>
                    <DatePicker value={formData.due_date} onChange={(val) => setFormData({ ...formData, due_date: val })} placeholder="Select due date..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700">
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Notes</label>
                  <textarea rows={2} placeholder="Optional description..." value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  />
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-neutral-850">
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg py-2 font-semibold transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal rounded-lg py-2 font-semibold transition-colors">
                    {submitting ? "Saving..." : "Add Deliverable"}
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

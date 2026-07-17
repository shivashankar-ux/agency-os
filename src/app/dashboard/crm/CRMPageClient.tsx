"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, X, Search, Filter, LayoutGrid, List, Phone, Mail,
  Globe, Calendar, DollarSign, Tag, User, ChevronRight,
  TrendingUp, AlertCircle, CheckCircle, Clock, Edit3, Trash2,
  MessageSquare, Activity, PhoneCall, AtSign, MoreVertical
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────
export type Lead = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  source: string;
  stage: string;
  deal_value: number;
  expected_close_date: string | null;
  notes: string | null;
  tags: string[] | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  assignee?: { name: string; role: string } | null;
};

export type LeadActivity = {
  id: string;
  lead_id: string;
  type: string;
  title: string;
  body: string | null;
  scheduled_at: string | null;
  completed: boolean;
  created_by: string | null;
  created_at: string;
  author?: { name: string } | null;
};

type Profile = { id: string; name: string; role: string };

// ── Stage Config ───────────────────────────────────────────────
export const STAGES = [
  { key: "prospect", label: "Prospect", color: "border-neutral-700", badge: "bg-neutral-800 text-neutral-400 border-neutral-700", dot: "bg-neutral-500" },
  { key: "qualified", label: "Qualified", color: "border-blue-800", badge: "bg-blue-950 text-blue-400 border-blue-900", dot: "bg-blue-500" },
  { key: "proposal", label: "Proposal", color: "border-indigo-800", badge: "bg-indigo-950 text-indigo-400 border-indigo-900", dot: "bg-indigo-500" },
  { key: "negotiation", label: "Negotiation", color: "border-yellow-800", badge: "bg-yellow-950 text-yellow-400 border-yellow-900", dot: "bg-yellow-500" },
  { key: "won", label: "Won ✓", color: "border-emerald-800", badge: "bg-emerald-950 text-emerald-400 border-emerald-900", dot: "bg-emerald-500" },
  { key: "lost", label: "Lost", color: "border-red-900", badge: "bg-red-950/60 text-red-400 border-red-900", dot: "bg-red-500" },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  cold_outreach: "Cold Outreach",
  inbound: "Inbound",
  social: "Social Media",
  event: "Event",
  other: "Other",
};

const ACTIVITY_ICONS: Record<string, any> = {
  note: MessageSquare,
  call: PhoneCall,
  email: AtSign,
  meeting: Calendar,
  follow_up: Clock,
};

function fmt(val: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

// ── Lead Card (Kanban) ─────────────────────────────────────────
function LeadCard({
  lead,
  onClick,
  canEdit,
  onDelete,
  onStageChange,
}: {
  lead: Lead;
  onClick: () => void;
  canEdit: boolean;
  onDelete: (id: string) => void;
  onStageChange: (id: string, stage: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stageConfig = STAGES.find((s) => s.key === lead.stage) || STAGES[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 cursor-pointer hover:border-neutral-700 transition-all group relative`}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-bold truncate">{lead.company_name}</p>
          {lead.contact_name && (
            <p className="text-neutral-500 text-xxs mt-0.5 truncate">{lead.contact_name}</p>
          )}
        </div>
        {canEdit && (
          <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-neutral-600 hover:text-white rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-36 py-1 text-xs">
                <button onClick={() => { onClick(); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-neutral-300 hover:bg-neutral-800 flex items-center gap-2">
                  <Edit3 size={11} /> View / Edit
                </button>
                <button onClick={() => { onDelete(lead.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-neutral-800 flex items-center gap-2">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deal value */}
      {lead.deal_value > 0 && (
        <div className="flex items-center gap-1 text-emerald-400 text-xxs font-bold mb-2">
          <DollarSign size={11} />
          {fmt(lead.deal_value)}
        </div>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between gap-2 flex-wrap mt-1">
        {lead.source && (
          <span className="text-neutral-600 text-xxs">{SOURCE_LABELS[lead.source] || lead.source}</span>
        )}
        {lead.expected_close_date && (
          <span className="text-neutral-600 text-xxs flex items-center gap-0.5">
            <Calendar size={10} /> {lead.expected_close_date}
          </span>
        )}
      </div>

      {lead.assignee && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-800">
          <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white-literal text-xxs font-bold">
            {lead.assignee.name[0]}
          </div>
          <span className="text-neutral-600 text-xxs">{lead.assignee.name}</span>
        </div>
      )}
    </motion.div>
  );
}

// ── Lead Detail Drawer ────────────────────────────────────────
function LeadDrawer({
  lead,
  activities,
  allProfiles,
  canEdit,
  onClose,
  onUpdate,
  onActivityAdd,
}: {
  lead: Lead;
  activities: LeadActivity[];
  allProfiles: Profile[];
  canEdit: boolean;
  onClose: () => void;
  onUpdate: (updated: Lead) => void;
  onActivityAdd: (leadId: string, act: LeadActivity) => void;
}) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"details" | "activity">("details");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [actForm, setActForm] = useState({ type: "note", title: "", body: "" });
  const [addingActivity, setAddingActivity] = useState(false);
  const [localActivities, setLocalActivities] = useState<LeadActivity[]>(activities);

  async function handleSave() {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .update({
          company_name: form.company_name,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          website: form.website,
          stage: form.stage,
          deal_value: form.deal_value,
          expected_close_date: form.expected_close_date,
          notes: form.notes,
          assigned_to: form.assigned_to,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id)
        .select("*, assignee:profiles!leads_assigned_to_fkey(name, role)")
        .single();
      if (error) throw error;
      onUpdate(data as Lead);
      setEditMode(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("lead_activities")
        .insert({
          lead_id: lead.id,
          type: actForm.type,
          title: actForm.title,
          body: actForm.body || null,
        })
        .select()
        .single();
      if (error) throw error;
      setLocalActivities((prev) => [data as LeadActivity, ...prev]);
      onActivityAdd(lead.id, data as LeadActivity);
      setActForm({ type: "note", title: "", body: "" });
      setAddingActivity(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  const stageConfig = STAGES.find((s) => s.key === form.stage) || STAGES[0];

  return (
    <motion.div
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-neutral-950 border-l border-neutral-800 z-40 flex flex-col shadow-2xl"
    >
      {/* Drawer Header */}
      <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-bold text-sm truncate">{lead.company_name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xxs px-2 py-0.5 rounded border font-semibold ${stageConfig.badge}`}>
              {stageConfig.label}
            </span>
            {lead.deal_value > 0 && (
              <span className="text-emerald-400 text-xxs font-bold">{fmt(lead.deal_value)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button onClick={() => setEditMode(!editMode)}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${editMode ? "bg-indigo-600 text-white-literal" : "text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"}`}>
              <Edit3 size={14} />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 pt-4 pb-0 border-b border-neutral-900">
        {(["details", "activity"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg capitalize transition-colors ${activeTab === tab ? "bg-neutral-900 text-white border border-neutral-800 border-b-transparent -mb-px" : "text-neutral-500 hover:text-white"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeTab === "details" && (
          <div className="space-y-4 text-xs">
            {editMode ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Company Name *</label>
                  <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Contact Name</label>
                    <input type="text" value={form.contact_name || ""} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Email</label>
                    <input type="email" value={form.contact_email || ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Phone</label>
                    <input type="tel" value={form.contact_phone || ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Website</label>
                    <input type="url" value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Pipeline Stage</label>
                    <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Deal Value (₹)</label>
                    <input type="number" value={form.deal_value} onChange={(e) => setForm({ ...form, deal_value: Number(e.target.value) })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Expected Close</label>
                    <input type="date" value={form.expected_close_date || ""} onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Assigned To</label>
                    <select value={form.assigned_to || ""} onChange={(e) => setForm({ ...form, assigned_to: e.target.value || null })}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      <option value="">Unassigned</option>
                      {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Notes</label>
                  <textarea rows={3} value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none resize-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditMode(false)} className="flex-1 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg py-2 font-semibold transition-colors text-xs">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal rounded-lg py-2 font-semibold transition-colors text-xs">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Contact Info */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <p className="text-neutral-500 text-xxs font-bold uppercase tracking-wider">Contact Information</p>
                  {lead.contact_name && (
                    <div className="flex items-center gap-2 text-xs">
                      <User size={13} className="text-neutral-500 shrink-0" />
                      <span className="text-white">{lead.contact_name}</span>
                    </div>
                  )}
                  {lead.contact_email && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={13} className="text-neutral-500 shrink-0" />
                      <a href={`mailto:${lead.contact_email}`} className="text-indigo-400 hover:underline">{lead.contact_email}</a>
                    </div>
                  )}
                  {lead.contact_phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <Phone size={13} className="text-neutral-500 shrink-0" />
                      <span className="text-white">{lead.contact_phone}</span>
                    </div>
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <Globe size={13} className="text-neutral-500 shrink-0" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline truncate">{lead.website}</a>
                    </div>
                  )}
                </div>

                {/* Deal Info */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3">
                  <p className="text-neutral-500 text-xxs font-bold uppercase tracking-wider">Deal Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-neutral-500 text-xxs">Stage</p>
                      <span className={`text-xxs px-2 py-0.5 rounded border font-semibold mt-1 inline-block ${stageConfig.badge}`}>{stageConfig.label}</span>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xxs">Deal Value</p>
                      <p className="text-emerald-400 font-bold text-sm mt-0.5">{lead.deal_value > 0 ? fmt(lead.deal_value) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xxs">Source</p>
                      <p className="text-white text-xs mt-0.5">{SOURCE_LABELS[lead.source] || lead.source}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 text-xxs">Close Date</p>
                      <p className="text-white text-xs mt-0.5">{lead.expected_close_date || "—"}</p>
                    </div>
                  </div>
                  {lead.assignee && (
                    <div>
                      <p className="text-neutral-500 text-xxs">Assigned To</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white-literal text-xxs font-bold">
                          {lead.assignee.name[0]}
                        </div>
                        <span className="text-white text-xs">{lead.assignee.name}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {lead.notes && (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                    <p className="text-neutral-500 text-xxs font-bold uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-neutral-300 text-xs leading-relaxed">{lead.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-3">
            {/* Add activity */}
            {canEdit && !addingActivity && (
              <button onClick={() => setAddingActivity(true)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-800 rounded-xl p-3 text-neutral-500 hover:text-white hover:border-neutral-700 text-xs font-semibold transition-colors">
                <Plus size={13} /> Log Activity
              </button>
            )}
            {addingActivity && (
              <form onSubmit={handleAddActivity} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Type</label>
                    <select value={actForm.type} onChange={(e) => setActForm({ ...actForm, type: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      <option value="note">Note</option>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                      <option value="meeting">Meeting</option>
                      <option value="follow_up">Follow Up</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Title *</label>
                    <input type="text" required value={actForm.title} onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                      placeholder="e.g. Initial call"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Notes</label>
                  <textarea rows={2} value={actForm.body} onChange={(e) => setActForm({ ...actForm, body: e.target.value })}
                    placeholder="What happened?"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAddingActivity(false)} className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 rounded-lg py-1.5 font-semibold">Cancel</button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white-literal rounded-lg py-1.5 font-semibold">Log It</button>
                </div>
              </form>
            )}

            {/* Activity feed */}
            {localActivities.length === 0 ? (
              <div className="py-8 text-center text-neutral-600 text-xs border border-dashed border-neutral-800 rounded-xl">
                No activity logged yet.
              </div>
            ) : (
              localActivities.map((act) => {
                const Icon = ACTIVITY_ICONS[act.type] || MessageSquare;
                return (
                  <div key={act.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex items-start gap-3">
                    <div className="p-1.5 bg-neutral-800 border border-neutral-750 rounded-lg shrink-0 mt-0.5">
                      <Icon size={13} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-xs font-semibold">{act.title}</p>
                      {act.body && <p className="text-neutral-400 text-xxs mt-0.5 leading-relaxed">{act.body}</p>}
                      <p className="text-neutral-600 text-xxs mt-1">{new Date(act.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main CRM Client ────────────────────────────────────────────
export default function CRMPageClient({
  initialLeads,
  allProfiles,
  permissions,
  orgId,
  userId,
}: {
  initialLeads: Lead[];
  allProfiles: Profile[];
  permissions: any;
  orgId: string;
  userId: string;
}) {
  const supabase = createClient();

  const canCreate = permissions?.crm?.create?.allowed ?? false;
  const canEdit = permissions?.crm?.edit?.allowed ?? false;
  const canDelete = permissions?.crm?.delete?.allowed ?? false;

  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_name: "", contact_name: "", contact_email: "", contact_phone: "",
    website: "", source: "other", stage: "prospect", deal_value: 0,
    expected_close_date: "", notes: "", assigned_to: "",
  });
  const [creating, setCreating] = useState(false);

  // ── Pipeline Totals ──
  const totalPipelineValue = leads.filter((l) => !["won", "lost"].includes(l.stage)).reduce((s, l) => s + l.deal_value, 0);
  const wonValue = leads.filter((l) => l.stage === "won").reduce((s, l) => s + l.deal_value, 0);
  const totalLeads = leads.length;

  // ── Filtered leads ──
  const filteredLeads = leads.filter((l) => {
    const matchSearch = l.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (l.contact_name?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchStage = stageFilter === "all" || l.stage === stageFilter;
    return matchSearch && matchStage;
  });

  // ── Open lead drawer ──
  async function openLead(lead: Lead) {
    setSelectedLead(lead);
    setLoadingActivities(true);
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });
    setLeadActivities((data ?? []) as LeadActivity[]);
    setLoadingActivities(false);
  }

  // ── Create lead ──
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          org_id: orgId,
          company_name: createForm.company_name,
          contact_name: createForm.contact_name || null,
          contact_email: createForm.contact_email || null,
          contact_phone: createForm.contact_phone || null,
          website: createForm.website || null,
          source: createForm.source,
          stage: createForm.stage,
          deal_value: createForm.deal_value || 0,
          expected_close_date: createForm.expected_close_date || null,
          notes: createForm.notes || null,
          assigned_to: createForm.assigned_to || null,
          created_by: userId,
        })
        .select("*, assignee:profiles!leads_assigned_to_fkey(name, role)")
        .single();
      if (error) throw error;
      setLeads((prev) => [data as Lead, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        company_name: "", contact_name: "", contact_email: "", contact_phone: "",
        website: "", source: "other", stage: "prospect", deal_value: 0,
        expected_close_date: "", notes: "", assigned_to: "",
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  // ── Delete lead ──
  async function handleDelete(id: string) {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await supabase.from("leads").delete().eq("id", id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (selectedLead?.id === id) setSelectedLead(null);
    } catch {}
  }

  // ── Update lead in state ──
  function handleLeadUpdate(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelectedLead(updated);
  }

  // ── Stage change (quick kanban) ──
  async function handleStageChange(id: string, stage: string) {
    try {
      await supabase.from("leads").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage } : l)));
    } catch {}
  }

  return (
    <div className="bg-neutral-950 flex flex-col min-h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-900 bg-neutral-950">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" />
                Sales CRM
              </h1>
              <p className="text-neutral-500 text-xs mt-0.5">Track prospects and manage your pipeline</p>
            </div>
            {canCreate && (
              <button onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white-literal px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/30">
                <Plus size={14} /> Add Lead
              </button>
            )}
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Total Leads", value: totalLeads, color: "text-white" },
              { label: "Pipeline Value", value: fmt(totalPipelineValue), color: "text-indigo-400" },
              { label: "Won This Period", value: fmt(wonValue), color: "text-emerald-400" },
              { label: "Active Stages", value: STAGES.filter((s) => filteredLeads.some((l) => l.stage === s.key)).length, color: "text-yellow-400" },
            ].map((k) => (
              <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3">
                <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                <p className="text-neutral-500 text-xxs mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input
                placeholder="Search company or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
              />
            </div>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none">
              <option value="all">All Stages</option>
              {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
              <button onClick={() => setView("kanban")}
                className={`p-1.5 rounded-md transition-colors ${view === "kanban" ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"}`}>
                <LayoutGrid size={13} />
              </button>
              <button onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"}`}>
                <List size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Board / List Content */}
        <div className="p-4 overflow-x-auto">
          {view === "kanban" ? (
            // ── KANBAN BOARD ──────────────────────────────────
            <div className="flex gap-4 pb-4" style={{ minHeight: "calc(100vh - 280px)" }}>
              {STAGES.map((stage) => {
                const stageLeads = filteredLeads.filter((l) => l.stage === stage.key);
                return (
                  <div key={stage.key} className={`flex flex-col w-64 shrink-0 bg-neutral-900/50 border-t-2 ${stage.color} rounded-xl overflow-hidden`}>
                    <div className="p-3 border-b border-neutral-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
                          <span className="text-white text-xs font-bold">{stage.label}</span>
                        </div>
                        <span className="text-neutral-600 text-xxs font-semibold bg-neutral-800 px-1.5 py-0.5 rounded">
                          {stageLeads.length}
                        </span>
                      </div>
                      {stageLeads.length > 0 && (
                        <p className="text-neutral-600 text-xxs mt-1">
                          {fmt(stageLeads.reduce((s, l) => s + l.deal_value, 0))}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      <AnimatePresence>
                        {stageLeads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            onClick={() => openLead(lead)}
                            canEdit={canEdit}
                            onDelete={handleDelete}
                            onStageChange={handleStageChange}
                          />
                        ))}
                      </AnimatePresence>
                      {stageLeads.length === 0 && (
                        <p className="text-neutral-700 text-xxs text-center py-6 italic">Empty</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ── LIST VIEW ─────────────────────────────────────
            <div className="space-y-1 max-w-5xl">
              {filteredLeads.length === 0 ? (
                <div className="py-12 text-center text-neutral-600 text-xs border border-dashed border-neutral-800 rounded-xl">
                  No leads found.
                </div>
              ) : (
                filteredLeads.map((lead, index) => {
                  const sc = STAGES.find((s) => s.key === lead.stage) || STAGES[0];
                  return (
                    <motion.div key={lead.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
                      onClick={() => openLead(lead)}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-neutral-700 cursor-pointer transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{lead.company_name}</p>
                        {lead.contact_name && <p className="text-neutral-500 text-xxs truncate">{lead.contact_name}</p>}
                      </div>
                      <span className={`text-xxs px-2 py-0.5 rounded border font-semibold shrink-0 ${sc.badge}`}>{sc.label}</span>
                      <span className="text-emerald-400 text-xs font-bold shrink-0 w-24 text-right">{lead.deal_value > 0 ? fmt(lead.deal_value) : "—"}</span>
                      {lead.expected_close_date && (
                        <span className="text-neutral-600 text-xxs shrink-0 hidden sm:block">{lead.expected_close_date}</span>
                      )}
                      <ChevronRight size={14} className="text-neutral-700 shrink-0" />
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <div className="fixed inset-0 bg-black/30 z-30" onClick={() => setSelectedLead(null)} />
            <LeadDrawer
              lead={selectedLead}
              activities={leadActivities}
              allProfiles={allProfiles}
              canEdit={canEdit}
              onClose={() => setSelectedLead(null)}
              onUpdate={handleLeadUpdate}
              onActivityAdd={(leadId, act) => setLeadActivities((prev) => [act, ...prev])}
            />
          </>
        )}
      </AnimatePresence>

      {/* Create Lead Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">New Lead</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-neutral-500 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Company Name *</label>
                  <input type="text" required placeholder="e.g. Acme Corp"
                    value={createForm.company_name} onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Contact Name</label>
                    <input type="text" placeholder="Full name" value={createForm.contact_name}
                      onChange={(e) => setCreateForm({ ...createForm, contact_name: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Email</label>
                    <input type="email" placeholder="contact@company.com" value={createForm.contact_email}
                      onChange={(e) => setCreateForm({ ...createForm, contact_email: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Phone</label>
                    <input type="tel" placeholder="+91 ..." value={createForm.contact_phone}
                      onChange={(e) => setCreateForm({ ...createForm, contact_phone: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Source</label>
                    <select value={createForm.source} onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Pipeline Stage</label>
                    <select value={createForm.stage} onChange={(e) => setCreateForm({ ...createForm, stage: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Deal Value (₹)</label>
                    <input type="number" min="0" value={createForm.deal_value}
                      onChange={(e) => setCreateForm({ ...createForm, deal_value: Number(e.target.value) })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Expected Close Date</label>
                    <input type="date" value={createForm.expected_close_date}
                      onChange={(e) => setCreateForm({ ...createForm, expected_close_date: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 font-semibold">Assign To</label>
                    <select value={createForm.assigned_to} onChange={(e) => setCreateForm({ ...createForm, assigned_to: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                      <option value="">Unassigned</option>
                      {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold">Notes</label>
                  <textarea rows={2} placeholder="Any initial context..." value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-3 border-t border-neutral-800">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl py-2.5 font-semibold transition-colors">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal rounded-xl py-2.5 font-semibold transition-all shadow-lg">
                    {creating ? "Creating..." : "Add Lead"}
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

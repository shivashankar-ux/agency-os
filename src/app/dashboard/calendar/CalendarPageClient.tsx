"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Calendar, CalendarDays,
  Briefcase, Users, Bell, Tag, Circle, Edit3, Trash2, Sparkles
} from "lucide-react";
import TaskDetailModal from "@/app/dashboard/components/TaskDetailModal";

// ── Types ──────────────────────────────────────────────────────
export type CalEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  color: string;
  client_id: string | null;
  project_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
};

export type TaskEvent = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  project_id: string | null;
  projects?: {
    name: string;
    clients?: {
      name: string;
    } | null;
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

export type MilestoneEvent = {
  id: string;
  title: string;
  due_date: string;
  status: string;
};

type Profile = { id: string; name: string };
type Client = { id: string; name: string };
type Project = { id: string; name: string };

// ── Constants ──────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  indigo: { bg: "bg-indigo-600", text: "text-white", dot: "bg-indigo-500" },
  emerald: { bg: "bg-emerald-600", text: "text-white", dot: "bg-emerald-500" },
  amber: { bg: "bg-amber-500", text: "text-white", dot: "bg-amber-500" },
  rose: { bg: "bg-rose-600", text: "text-white", dot: "bg-rose-500" },
  violet: { bg: "bg-violet-600", text: "text-white", dot: "bg-violet-500" },
  task: { bg: "bg-neutral-700", text: "text-neutral-200", dot: "bg-neutral-500" },
  milestone: { bg: "bg-yellow-700", text: "text-yellow-100", dot: "bg-yellow-500" },
};

const EVENT_TYPE_ICONS: Record<string, any> = {
  meeting: Users,
  deadline: Clock,
  reminder: Bell,
  task: Tag,
  other: Circle,
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Event Pill ─────────────────────────────────────────────────
function EventPill({ label, color, onClick }: { label: string; color: string; onClick: (e: React.MouseEvent) => void }) {
  const c = EVENT_COLORS[color] || EVENT_COLORS.indigo;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      className={`${c.bg} ${c.text} text-xxs px-1.5 py-0.5 rounded truncate w-full text-left font-medium hover:opacity-90 transition-opacity`}
    >
      {label}
    </button>
  );
}

// ── Event Modal ────────────────────────────────────────────────
function EventModal({
  mode,
  event,
  defaultDate,
  allProfiles,
  allClients,
  allProjects,
  canEdit,
  onClose,
  onSave,
  onDelete,
}: {
  mode: "create" | "edit" | "view";
  event?: CalEvent;
  defaultDate?: Date;
  allProfiles: Profile[];
  allClients: Client[];
  allProjects: Project[];
  canEdit: boolean;
  onClose: () => void;
  onSave: (ev: CalEvent) => void;
  onDelete?: (id: string) => void;
}) {
  const defaultStart = defaultDate
    ? `${dateKey(defaultDate)}T09:00`
    : new Date().toISOString().slice(0, 16);
  const defaultEnd = defaultDate
    ? `${dateKey(defaultDate)}T10:00`
    : new Date().toISOString().slice(0, 16);

  const [form, setForm] = useState({
    title: event?.title ?? "",
    description: event?.description ?? "",
    event_type: event?.event_type ?? "meeting",
    start_at: event?.start_at ? event.start_at.slice(0, 16) : defaultStart,
    end_at: event?.end_at ? event.end_at.slice(0, 16) : defaultEnd,
    all_day: event?.all_day ?? false,
    color: event?.color ?? "indigo",
    assigned_to: event?.assigned_to ?? "",
    client_id: event?.client_id ?? "",
    project_id: event?.project_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        event_type: form.event_type,
        start_at: form.start_at,
        end_at: form.end_at || null,
        all_day: form.all_day,
        color: form.color,
        assigned_to: form.assigned_to || null,
        client_id: form.client_id || null,
        project_id: form.project_id || null,
        updated_at: new Date().toISOString(),
      };
      if (mode === "edit" && event) {
        const { data, error } = await supabase.from("calendar_events").update(payload).eq("id", event.id).select().single();
        if (error) throw error;
        onSave(data as CalEvent);
      } else {
        const { data, error } = await supabase.from("calendar_events").insert(payload).select().single();
        if (error) throw error;
        onSave(data as CalEvent);
      }
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event || !onDelete) return;
    if (!confirm("Delete this event?")) return;
    try {
      await supabase.from("calendar_events").delete().eq("id", event.id);
      onDelete(event.id);
      onClose();
    } catch {}
  }

  const colors = ["indigo", "emerald", "amber", "rose", "violet"];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            {mode === "create" ? "New Event" : mode === "edit" ? "Edit Event" : event?.title}
          </h3>
          <div className="flex items-center gap-2">
            {mode === "view" && canEdit && event && (
              <>
                <button onClick={handleDelete} className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors"><X size={16} /></button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold">Title *</label>
            <input type="text" required placeholder="Event title"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Type</label>
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="reminder">Reminder</option>
                <option value="task">Task</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Assign To</label>
              <select value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none">
                <option value="">Anyone</option>
                {allProfiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="all_day" checked={form.all_day}
              onChange={(e) => setForm({ ...form, all_day: e.target.checked })}
              className="accent-indigo-500" />
            <label htmlFor="all_day" className="text-neutral-400 font-semibold">All Day</label>
          </div>

          {!form.all_day ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold">Start</label>
                <input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold">End</label>
                <input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-neutral-400 font-semibold">Date</label>
              <input type="date" value={form.start_at.split("T")[0]} onChange={(e) => setForm({ ...form, start_at: e.target.value + "T00:00" })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none" />
            </div>
          )}

          {/* Color Picker */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold">Color</label>
            <div className="flex items-center gap-2">
              {colors.map((c) => {
                const col = EVENT_COLORS[c];
                return (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full ${col.bg} transition-all ${form.color === c ? "ring-2 ring-white ring-offset-1 ring-offset-neutral-950 scale-110" : "opacity-70 hover:opacity-100"}`} />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold">Notes</label>
            <textarea rows={2} placeholder="Optional description..." value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none resize-none" />
          </div>

          {canEdit && (
            <div className="flex gap-2.5 pt-3 border-t border-neutral-800">
              <button type="button" onClick={onClose}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl py-2.5 font-semibold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-xl py-2.5 font-semibold transition-all">
                {saving ? "Saving..." : mode === "create" ? "Create Event" : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Calendar Client ───────────────────────────────────────
export default function CalendarPageClient({
  initialEvents,
  taskEvents,
  milestoneEvents,
  allProfiles,
  allClients,
  allProjects,
  permissions,
  orgId,
  currentProfile,
}: {
  initialEvents: CalEvent[];
  taskEvents: TaskEvent[];
  milestoneEvents: MilestoneEvent[];
  allProfiles: Profile[];
  allClients: Client[];
  allProjects: Project[];
  permissions: any;
  orgId: string;
  currentProfile: any;
}) {
  const router = useRouter();
  const canCreate = permissions?.calendar?.create?.allowed ?? false;
  const canEdit = permissions?.calendar?.edit?.allowed ?? false;

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<"month" | "week">("month");
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [tasks, setTasks] = useState<TaskEvent[]>(taskEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any | null>(null);

  // Quick Task Planner State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unassigned" | "unscheduled">("all");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProject, setQuickProject] = useState(allProjects[0]?.id || "");
  const [quickAssignee, setQuickAssignee] = useState("");
  const [quickDueDate, setQuickDueDate] = useState("");
  const [allocatorLoading, setAllocatorLoading] = useState(false);

  const supabase = createClient();

  // ── Database Updates ──
  async function handleAssignTask(taskId: string, userId: string | null) {
    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: userId || null, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      alert("Error assigning task: " + error.message);
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: userId } : t));
    }
  }

  async function handleSetDueDate(taskId: string, date: string | null) {
    const { error } = await supabase
      .from("tasks")
      .update({ due_date: date || null, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      alert("Error setting due date: " + error.message);
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: date } : t));
    }
  }

  async function handleSetProject(taskId: string, projectId: string) {
    const { error } = await supabase
      .from("tasks")
      .update({ project_id: projectId, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      alert("Error updating project: " + error.message);
    } else {
      const { data: updatedTask, error: fetchErr } = await supabase
        .from("tasks")
        .select("id, title, due_date, status, priority, assigned_to, project_id, projects(name, clients(name))")
        .eq("id", taskId)
        .single();
      if (!fetchErr && updatedTask) {
        setTasks(prev => prev.map(t => t.id === taskId ? (updatedTask as any) : t));
      }
    }
  }

  async function handleSetStatus(taskId: string, status: string) {
    const { error } = await supabase
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      alert("Error updating status: " + error.message);
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    }
  }

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim() || !quickProject) return;
    setAllocatorLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: quickTitle.trim(),
          project_id: quickProject,
          assigned_to: quickAssignee || null,
          due_date: quickDueDate || null,
          status: "todo",
          priority: "medium",
        })
        .select("id, title, due_date, status, priority, assigned_to, project_id, projects(name, clients(name))")
        .single();
      
      if (error) throw error;
      if (data) {
        setTasks(prev => [data as any, ...prev]);
        setQuickTitle("");
        setQuickDueDate("");
        setQuickAssignee("");
      }
    } catch (err: any) {
      alert("Error creating task: " + err.message);
    } finally {
      setAllocatorLoading(false);
    }
  }

  // ── Navigation ──
  function prev() {
    if (view === "month") setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    else setViewDate(new Date(viewDate.getTime() - 7 * 86400000));
  }
  function next() {
    if (view === "month") setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    else setViewDate(new Date(viewDate.getTime() + 7 * 86400000));
  }
  function goToday() {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  // ── Build all unified events per day ──
  const eventsByDay = useMemo(() => {
    const map: Record<string, Array<{ id: string; title: string; color: string; type: "event" | "task" | "milestone"; raw?: CalEvent }>> = {};

    events.forEach((ev) => {
      const key = ev.start_at.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push({ id: ev.id, title: ev.title, color: ev.color, type: "event", raw: ev });
    });

    tasks.forEach((t) => {
      if (!t.due_date || t.status === "done") return;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push({ id: t.id, title: t.title, color: "task", type: "task", raw: t as any });
    });

    milestoneEvents.forEach((m) => {
      if (!m.due_date || m.status === "completed") return;
      const key = m.due_date;
      if (!map[key]) map[key] = [];
      map[key].push({ id: m.id, title: m.title, color: "milestone", type: "milestone" });
    });

    return map;
  }, [events, tasks, milestoneEvents]);

  // ── Month grid days ──
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

  // ── Week grid days ──
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [viewDate]);

  function openCreateOnDate(date: Date) {
    if (!canCreate) return;
    setSelectedDate(date);
    setSelectedEvent(null);
    setModalMode("create");
  }

  function openEvent(ev: CalEvent) {
    setSelectedEvent(ev);
    setModalMode(canEdit ? "edit" : "view");
  }

  function handleEventSaved(ev: CalEvent) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === ev.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = ev;
        return next;
      }
      return [ev, ...prev];
    });
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  // ── Filtered tasks list for Allocator ──
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search filter
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.projects?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
        (t.projects?.clients?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      if (!matchesSearch) return false;

      // Tab filter
      if (activeTab === "unassigned") return !t.assigned_to;
      if (activeTab === "unscheduled") return !t.due_date;
      return true;
    });
  }, [tasks, searchQuery, activeTab]);

  const headerTitle = view === "month"
    ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
    : `Week of ${weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-neutral-850 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-400" />
            Calendar & Scheduler
          </h1>
          <button onClick={goToday} className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors">
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            {(["month", "week"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${view === v ? "bg-indigo-650 text-white shadow" : "text-neutral-500 hover:text-white"}`}>
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button onClick={prev} className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-white text-xs font-bold px-2.5 min-w-36 text-center">{headerTitle}</span>
            <button onClick={next} className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {canCreate && (
            <button onClick={() => { setSelectedDate(today); setSelectedEvent(null); setModalMode("create"); }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/10">
              <Plus size={14} /> New Event
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-wider pl-1">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />Events</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neutral-500 shadow-sm" />Tasks Due</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm" />Milestones</span>
          </div>

          {/* ── MONTH VIEW ── */}
          {view === "month" && (
            <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-2xl overflow-hidden shadow-sm">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-neutral-800/60 bg-neutral-950/15">
                {DAYS.map((d) => (
                  <div key={d} className="py-3.5 text-center text-neutral-500 text-[10px] font-bold uppercase tracking-widest border-r border-neutral-800/10 last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7">
                {monthDays.map((day, idx) => {
                  const key = day ? dateKey(day) : null;
                  const dayEvents = key ? (eventsByDay[key] ?? []) : [];
                  const isToday = day ? isSameDay(day, today) : false;
                  const isCurrentMonth = day ? day.getMonth() === viewDate.getMonth() : false;

                  return (
                    <div
                      key={idx}
                      onClick={() => day && openCreateOnDate(day)}
                      className={`min-h-[105px] p-2 border-b border-r border-neutral-800/40 transition-colors relative
                        ${day ? (canCreate ? "cursor-pointer hover:bg-neutral-850/10" : "cursor-default") : "bg-neutral-950/15"}
                        ${idx % 7 === 6 ? "border-r-0" : ""}`}
                    >
                      {day && (
                        <>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1.5 text-xs font-bold mx-auto
                            ${isToday ? "bg-indigo-650 text-white shadow-sm" : isCurrentMonth ? "text-white" : "text-neutral-700"}`}>
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((ev) => (
                              <EventPill
                                key={ev.id}
                                label={ev.title}
                                color={ev.color}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ev.type === "event" && ev.raw) openEvent(ev.raw);
                                  if (ev.type === "task" && ev.raw) setSelectedTaskForModal(ev.raw);
                                }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <p className="text-neutral-500 text-[9px] font-bold text-center">+{dayEvents.length - 3} MORE</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── WEEK VIEW ── */}
          {view === "week" && (
            <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass rounded-2xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-7">
                {weekDays.map((day, idx) => {
                  const key = dateKey(day);
                  const dayEvents = eventsByDay[key] ?? [];
                  const isToday = isSameDay(day, today);

                  return (
                    <div key={idx}
                      className={`border-r border-neutral-800/40 last:border-r-0 ${isToday ? "bg-indigo-950/10" : ""}`}>
                      {/* Day header */}
                      <div
                        onClick={() => openCreateOnDate(day)}
                        className={`p-3.5 text-center border-b border-neutral-800/40 cursor-pointer hover:bg-neutral-850/10 transition-colors`}>
                        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">{DAYS[day.getDay()]}</p>
                        <div className={`w-8 h-8 rounded-full mx-auto mt-1 flex items-center justify-center text-sm font-bold
                          ${isToday ? "bg-indigo-650 text-white shadow-sm" : "text-white"}`}>
                          {day.getDate()}
                        </div>
                      </div>
                      {/* Events */}
                      <div className="p-2 space-y-1 min-h-[250px]">
                        {dayEvents.map((ev) => (
                          <EventPill
                            key={ev.id}
                            label={ev.title}
                            color={ev.color}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ev.type === "event" && ev.raw) openEvent(ev.raw);
                              if (ev.type === "task" && ev.raw) setSelectedTaskForModal(ev.raw);
                            }}
                          />
                        ))}
                        {dayEvents.length === 0 && (
                          <p className="text-neutral-700 text-[10px] text-center mt-6 italic">No items</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Side: Quick Task Planner & Allocator Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card-glass rounded-2xl p-5 shadow-sm space-y-4 flex flex-col">
            <div className="flex items-center gap-1.5 border-b border-neutral-800 pb-3">
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
              <h2 className="text-white text-xs font-bold tracking-wider uppercase">
                Quick Task Allocator
              </h2>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleQuickCreate} className="space-y-2.5 bg-neutral-950/30 border border-neutral-800/60 rounded-xl p-3 text-xxs">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Set Quick Task</span>
              <input
                type="text"
                required
                placeholder="Write task title..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 font-sans"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  required
                  value={quickProject}
                  onChange={(e) => setQuickProject(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="">Select Project</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <select
                  value={quickAssignee}
                  onChange={(e) => setQuickAssignee(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none"
                >
                  <option value="">Unassigned</option>
                  {allProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={allocatorLoading || !quickTitle.trim() || !quickProject}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 rounded-lg flex items-center justify-center transition-all shrink-0"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Filters and Search */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks or clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-8 pr-3 text-xxs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                />
                <div className="absolute left-2.5 top-2.5 text-neutral-600">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-850 text-[10px] font-bold">
                {(["all", "unassigned", "unscheduled"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1 rounded-md text-center transition-all ${
                      activeTab === tab ? "bg-neutral-800 text-white shadow-sm" : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    {tab === "all" ? "All Tasks" : tab === "unassigned" ? "No Assignee" : "No Due Date"}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-xxs text-neutral-500 italic">
                  No pending tasks found
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const clientName = t.projects?.clients?.name || "No Client";
                  return (
                    <div key={t.id} className="bg-neutral-950/30 border border-neutral-800/80 rounded-xl p-3.5 space-y-2 text-xxs hover:border-neutral-700/60 transition-all shadow-inner">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className={`inline-block border text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${getClientColorClass(clientName)}`}>
                            {clientName}
                          </span>
                          <span className="text-neutral-500 font-bold tracking-tight">{t.projects?.name}</span>
                        </div>
                        <h4
                          onClick={() => setSelectedTaskForModal(t)}
                          className="text-white font-bold text-xs leading-snug hover:text-indigo-400 cursor-pointer transition-colors"
                        >
                          {t.title}
                        </h4>
                      </div>

                      {/* Inline Allocator Inputs */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div>
                          <label className="text-[8px] font-bold text-neutral-550 block mb-0.5 uppercase tracking-wide">Assignee</label>
                          <select
                            value={t.assigned_to || ""}
                            onChange={(e) => handleAssignTask(t.id, e.target.value)}
                            className="bg-neutral-950/80 border border-neutral-800/85 text-[10px] text-white rounded p-1 w-full focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {allProfiles.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] font-bold text-neutral-550 block mb-0.5 uppercase tracking-wide">Due Date</label>
                          <input
                            type="date"
                            value={t.due_date || ""}
                            onChange={(e) => handleSetDueDate(t.id, e.target.value)}
                            className="bg-neutral-950/80 border border-neutral-800/85 text-[10px] text-white rounded p-0.5 w-full focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-bold text-neutral-550 block mb-0.5 uppercase tracking-wide">Status</label>
                          <select
                            value={t.status}
                            onChange={(e) => handleSetStatus(t.id, e.target.value)}
                            className="bg-neutral-950/80 border border-neutral-800/85 text-[10px] text-white rounded p-1 w-full focus:outline-none font-semibold capitalize"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                          </select>
                        </div>
                      </div>

                      {/* Project selector */}
                      <div className="pt-1.5 border-t border-neutral-800/40">
                        <select
                          value={t.project_id || ""}
                          onChange={(e) => handleSetProject(t.id, e.target.value)}
                          className="bg-neutral-950/40 border border-neutral-800/30 text-[9px] text-neutral-400 rounded px-1.5 py-0.5 w-full focus:outline-none"
                        >
                          <option value="">Link Project</option>
                          {allProjects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalMode && (
          <EventModal
            mode={modalMode === "edit" && selectedEvent ? "edit" : "create"}
            event={selectedEvent ?? undefined}
            defaultDate={selectedDate ?? undefined}
            allProfiles={allProfiles}
            allClients={allClients}
            allProjects={allProjects}
            canEdit={canEdit || canCreate}
            onClose={() => { setModalMode(null); setSelectedEvent(null); }}
            onSave={handleEventSaved}
            onDelete={handleEventDeleted}
          />
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      {selectedTaskForModal && (
        <TaskDetailModal
          task={selectedTaskForModal}
          currentProfile={currentProfile}
          allProfiles={allProfiles as any}
          onClose={() => setSelectedTaskForModal(null)}
          onUpdate={() => router.refresh()}
        />
      )}
    </div>
  );
}

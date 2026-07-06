"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, Calendar, CalendarDays,
  Briefcase, Users, Bell, Tag, Circle, Edit3, Trash2
} from "lucide-react";

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
  due_date: string;
  status: string;
  priority: string;
};

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
}: {
  initialEvents: CalEvent[];
  taskEvents: TaskEvent[];
  milestoneEvents: MilestoneEvent[];
  allProfiles: Profile[];
  allClients: Client[];
  allProjects: Project[];
  permissions: any;
  orgId: string;
}) {
  const canCreate = permissions?.calendar?.create?.allowed ?? false;
  const canEdit = permissions?.calendar?.edit?.allowed ?? false;

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<"month" | "week">("month");
  const [events, setEvents] = useState<CalEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);

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

    taskEvents.forEach((t) => {
      if (!t.due_date || t.status === "done") return;
      const key = t.due_date;
      if (!map[key]) map[key] = [];
      map[key].push({ id: t.id, title: t.title, color: "task", type: "task" });
    });

    milestoneEvents.forEach((m) => {
      if (!m.due_date || m.status === "completed") return;
      const key = m.due_date;
      if (!map[key]) map[key] = [];
      map[key].push({ id: m.id, title: m.title, color: "milestone", type: "milestone" });
    });

    return map;
  }, [events, taskEvents, milestoneEvents]);

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

  const headerTitle = view === "month"
    ? `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`
    : `Week of ${weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;

  return (
    <div className="min-h-screen bg-neutral-950 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays size={20} className="text-indigo-400" />
            Calendar
          </h1>
          <button onClick={goToday} className="text-xs bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(["month", "week"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 text-xs font-semibold rounded-md capitalize transition-colors ${view === v ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-white"}`}>
                {v}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors">
              <ChevronLeft size={15} />
            </button>
            <span className="text-white text-sm font-semibold px-3 min-w-40 text-center">{headerTitle}</span>
            <button onClick={next} className="p-1.5 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>

          {canCreate && (
            <button onClick={() => { setSelectedDate(today); setSelectedEvent(null); setModalMode("create"); }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-900/30">
              <Plus size={14} /> New Event
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xxs text-neutral-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Events</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-500" />Tasks Due</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />Milestones</span>
      </div>

      {/* ── MONTH VIEW ────────────────────────────────────── */}
      {view === "month" && (
        <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-neutral-800">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-neutral-600 text-xxs font-bold uppercase tracking-wider">
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
                  className={`min-h-[90px] p-1.5 border-b border-r border-neutral-800/40 transition-colors relative
                    ${day ? (canCreate ? "cursor-pointer hover:bg-neutral-800/30" : "cursor-default") : "bg-neutral-950/30"}
                    ${idx % 7 === 6 ? "border-r-0" : ""}`}
                >
                  {day && (
                    <>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 text-xs font-bold mx-auto
                        ${isToday ? "bg-indigo-600 text-white" : isCurrentMonth ? "text-neutral-300" : "text-neutral-700"}`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <EventPill
                            key={ev.id}
                            label={ev.title}
                            color={ev.color}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ev.type === "event" && ev.raw) openEvent(ev.raw);
                            }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <p className="text-neutral-600 text-xxs pl-1">+{dayEvents.length - 3} more</p>
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

      {/* ── WEEK VIEW ─────────────────────────────────────── */}
      {view === "week" && (
        <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((day, idx) => {
              const key = dateKey(day);
              const dayEvents = eventsByDay[key] ?? [];
              const isToday = isSameDay(day, today);

              return (
                <div key={idx}
                  className={`border-r border-neutral-800/50 last:border-r-0 ${isToday ? "bg-indigo-950/20" : ""}`}>
                  {/* Day header */}
                  <div
                    onClick={() => openCreateOnDate(day)}
                    className={`p-3 text-center border-b border-neutral-800/50 cursor-pointer hover:bg-neutral-800/30 transition-colors`}>
                    <p className="text-neutral-600 text-xxs font-bold uppercase">{DAYS[day.getDay()]}</p>
                    <div className={`w-8 h-8 rounded-full mx-auto mt-1 flex items-center justify-center text-sm font-bold
                      ${isToday ? "bg-indigo-600 text-white" : "text-neutral-300"}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  {/* Events */}
                  <div className="p-1.5 space-y-1 min-h-[200px]">
                    {dayEvents.map((ev) => (
                      <EventPill
                        key={ev.id}
                        label={ev.title}
                        color={ev.color}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.type === "event" && ev.raw) openEvent(ev.raw);
                        }}
                      />
                    ))}
                    {dayEvents.length === 0 && (
                      <p className="text-neutral-800 text-xxs text-center mt-4 italic">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

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
    </div>
  );
}

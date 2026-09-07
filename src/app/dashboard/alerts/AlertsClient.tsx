"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, Send, Calendar, Clock, Repeat, Sparkles, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { createEmailAlert, deleteEmailAlert } from "@/app/actions/alerts";

type Employee = { id: string; name: string; email: string };
type Client = { id: string; name: string };
type Assignment = { client_id: string; user_id: string };

type Alert = {
  id: string;
  subject: string;
  message: string;
  scheduled_for: string;
  schedule_type?: string;
  target_date?: string;
  occurrences_per_day?: number;
  sent_count?: number;
  status: string;
  recipient?: { name: string; email: string } | null;
  recipient_email?: string;
  recipient_name?: string;
};

export default function AlertsClient({
  employees,
  clients,
  assignments,
  alerts: initialAlerts,
}: {
  employees: Employee[];
  clients: Client[];
  assignments: Assignment[];
  alerts: Alert[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: boolean; message?: string } | null>(null);
  const [alertsList, setAlertsList] = useState<Alert[]>(initialAlerts);

  const [recipientMode, setRecipientMode] = useState<"employee" | "custom">("employee");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [scheduleType, setScheduleType] = useState<"immediate" | "specific_date" | "weekly_recurring">("specific_date");
  const [targetDate, setTargetDate] = useState("2026-09-07"); // Default Monday Sept 7th
  const [recurrenceDay, setRecurrenceDay] = useState("1"); // Monday = 1
  const [occurrencesPerDay, setOccurrencesPerDay] = useState(4); // 4 times a day
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const [subject, setSubject] = useState("🎨 Creative Review Reminder: Deliverables due today!");
  const [message, setMessage] = useState("Reminder: Please complete and upload all client creative deliverables for review today by 6:00 PM.");

  const assignedEmployees = selectedClient
    ? employees.filter((employee) =>
        assignments.some((assignment) => assignment.client_id === selectedClient && assignment.user_id === employee.id)
      )
    : employees; // fallback to all employees if no client chosen

  function applyPreset(type: "creative_review" | "client_delivery") {
    if (type === "creative_review") {
      setScheduleType("specific_date");
      setTargetDate("2026-09-07");
      setOccurrencesPerDay(4);
      setStartTime("09:00");
      setEndTime("18:00");
      setSubject("🎨 Creative Review Reminder: Review required before Wednesday delivery!");
      setMessage("Hi team,\n\nToday (Monday 7th) is the review day for upcoming client creatives due this Wednesday (9th). Please finish all edits and post for approval.");
    } else {
      setScheduleType("specific_date");
      setTargetDate("2026-09-09");
      setOccurrencesPerDay(1);
      setStartTime("10:00");
      setSubject("🚀 Client Creative Delivery Day!");
      setMessage("Hi team,\n\nToday (Wednesday 9th) is final delivery day for client creatives. Ensure all final files are sent to the client portal.");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await createEmailAlert(formData);
      if (response.error) {
        setResult({ error: response.error });
      } else {
        setResult({
          success: true,
          message: response.status === "sent" ? "Alert sent successfully via email!" : "Alert scheduled successfully!",
        });
        form.reset();
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this alert?")) return;
    const res = await deleteEmailAlert(id);
    if (res?.success) {
      setAlertsList(alertsList.filter((a) => a.id !== id));
    } else if (res?.error) {
      alert(res.error);
    }
  }

  // Calculate live preview schedule text
  const previewText = () => {
    if (scheduleType === "immediate") return "Will send 1 email notification immediately right now.";

    const occ = occurrencesPerDay > 1 ? `${occurrencesPerDay} times` : "1 time";
    const timeWindow = `${startTime} to ${endTime}`;

    if (scheduleType === "specific_date") {
      return `Will send ${occ} on ${targetDate || "selected date"} between ${timeWindow}.`;
    }

    const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(recurrenceDay)] || "Monday";
    return `Will repeat every ${dayName}, sending ${occ} per day between ${timeWindow}.`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-16 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <Bell className="text-amber-500" size={24} />
          Email Alerts & Notifications
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Send instant or scheduled email notifications to team members using Resend.
        </p>
      </div>

      {/* Quick Presets */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" /> Agency Presets:
        </span>
        <button
          type="button"
          onClick={() => applyPreset("creative_review")}
          className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
        >
          🎨 Review Day (4x on Mon 7th)
        </button>
        <button
          type="button"
          onClick={() => applyPreset("client_delivery")}
          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
        >
          🚀 Client Delivery (Wed 9th)
        </button>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        {/* Recipient Mode */}
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            1. Recipient
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setRecipientMode("employee")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                recipientMode === "employee"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                  : "border-neutral-800 text-neutral-400 bg-neutral-950 hover:text-white"
              }`}
            >
              Team Employee
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode("custom")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                recipientMode === "custom"
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md"
                  : "border-neutral-800 text-neutral-400 bg-neutral-950 hover:text-white"
              }`}
            >
              Custom Email Address
            </button>
          </div>
          <input type="hidden" name="recipient_mode" value={recipientMode} />

          {recipientMode === "employee" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Filter by Client (Optional)</label>
                <select
                  name="client_id"
                  value={selectedClient}
                  onChange={(e) => {
                    setSelectedClient(e.target.value);
                    setSelectedEmployee("");
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Clients / All Team</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Select Employee *</label>
                <select
                  name="recipient_id"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required={recipientMode === "employee"}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose an employee...</option>
                  {assignedEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient Email *</label>
                <input
                  name="recipient_email"
                  type="email"
                  required={recipientMode === "custom"}
                  placeholder="colleague@agency.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient Name</label>
                <input
                  name="recipient_name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Schedule Mode */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            2. Frequency & Occurrences
          </label>

          <div className="grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setScheduleType("immediate")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "immediate"
                  ? "bg-indigo-600/10 border-indigo-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Send size={16} className="mt-0.5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">⚡ Right Now</div>
                <div className="text-[11px] text-neutral-400">Send 1 email immediately</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType("specific_date")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "specific_date"
                  ? "bg-indigo-600/10 border-indigo-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Calendar size={16} className="mt-0.5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">📅 Specific Date</div>
                <div className="text-[11px] text-neutral-400">Target a specific day (e.g. Sept 7th)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType("weekly_recurring")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "weekly_recurring"
                  ? "bg-indigo-600/10 border-indigo-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Repeat size={16} className="mt-0.5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">🔄 Weekly Recurring</div>
                <div className="text-[11px] text-neutral-400">Every Monday, Tuesday, etc.</div>
              </div>
            </button>
          </div>
          <input type="hidden" name="schedule_type" value={scheduleType} />

          {/* Conditional Options */}
          {scheduleType !== "immediate" && (
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                {scheduleType === "specific_date" ? (
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Target Date *</label>
                    <input
                      type="date"
                      name="target_date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      required={scheduleType === "specific_date"}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Day of Week *</label>
                    <select
                      name="recurrence_day"
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                      <option value="0">Sunday</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Occurrences on That Day *
                  </label>
                  <select
                    name="occurrences_per_day"
                    value={occurrencesPerDay}
                    onChange={(e) => setOccurrencesPerDay(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-amber-400 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">1 time on that day</option>
                    <option value="2">2 times on that day</option>
                    <option value="3">3 times on that day</option>
                    <option value="4">4 times on that day (Review Day Preset)</option>
                    <option value="5">5 times on that day</option>
                    <option value="6">6 times on that day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Time Window</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      name="start_time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white"
                    />
                    <span className="text-neutral-500 text-xs">to</span>
                    <input
                      type="time"
                      name="end_time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Summary Banner */}
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
                <Clock size={14} className="shrink-0" />
                <span>{previewText()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            3. Email Content
          </label>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Subject *</label>
            <input
              name="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Image Attachment (Optional, max 10 MB)</label>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="block w-full text-xs text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-800 file:px-3 file:py-2 file:text-neutral-200"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Message Body *</label>
            <textarea
              name="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your email alert message..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-y"
            />
          </div>
        </div>

        {/* Alerts & Results */}
        {result?.error && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{result.error}</div>
          </div>
        )}

        {result?.success && (
          <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <div>{result.message}</div>
          </div>
        )}

        {/* Submit */}
        <button
          disabled={isPending || (recipientMode === "employee" && employees.length === 0)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md cursor-pointer"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isPending ? "Processing..." : scheduleType === "immediate" ? "Send Alert Now" : "Schedule Alert"}
        </button>
      </form>

      {/* Alert Log */}
      <section className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" /> Recent & Scheduled Alerts
        </h2>

        {alertsList.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
            No alerts set up yet. Create your first email alert above!
          </div>
        ) : (
          <div className="space-y-2.5">
            {alertsList.map((alertItem) => (
              <div
                key={alertItem.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white text-sm truncate">{alertItem.subject}</span>
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold ${
                        alertItem.status === "sent"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : alertItem.status === "scheduled"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {alertItem.status}
                    </span>

                    {alertItem.occurrences_per_day && alertItem.occurrences_per_day > 1 && (
                      <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                        ⚡ {alertItem.occurrences_per_day}x a day (Sent {alertItem.sent_count || 0}/{alertItem.occurrences_per_day})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 truncate">
                    To {alertItem.recipient?.name || alertItem.recipient_name || "Recipient"} (
                    {alertItem.recipient?.email || alertItem.recipient_email || "no email"})
                  </p>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{alertItem.message}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-neutral-500">
                    {new Date(alertItem.scheduled_for).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDelete(alertItem.id)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
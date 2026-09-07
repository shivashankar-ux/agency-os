"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageSquare, Loader2, Send, Calendar, Clock, Repeat, Sparkles, CheckCircle2, AlertCircle, Trash2, Check, ExternalLink, Phone } from "lucide-react";
import { createWhatsAppAlert, deleteWhatsAppAlert } from "@/app/actions/whatsapp-alerts";

type Employee = { id: string; name: string; email: string; role?: string };
type Client = { id: string; name: string };
type Assignment = { client_id: string; user_id: string };

type WhatsAppAlert = {
  id: string;
  subject: string;
  message: string;
  recipient_phone?: string;
  recipient_name?: string;
  scheduled_for: string;
  schedule_type?: string;
  target_date?: string;
  occurrences_per_day?: number;
  sent_count?: number;
  status: string;
  recipient?: { name: string; email: string } | null;
};

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function WhatsAppAlertsClient({
  currentUserId,
  employees,
  clients,
  assignments,
  alerts: initialAlerts,
}: {
  currentUserId?: string;
  employees: Employee[];
  clients: Client[];
  assignments: Assignment[];
  alerts: WhatsAppAlert[];
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; success?: boolean; message?: string; whatsappUrl?: string } | null>(null);
  const [isSentSuccess, setIsSentSuccess] = useState(false);
  const [alertsList, setAlertsList] = useState<WhatsAppAlert[]>(initialAlerts);

  const [recipientMode, setRecipientMode] = useState<"employee" | "custom">("employee");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("ALL_TEAM");
  const [customPhone, setCustomPhone] = useState("918341928526"); // Default number as requested
  const [customName, setCustomName] = useState("Shiva Shankar");

  const [scheduleType, setScheduleType] = useState<"weekly_recurring" | "specific_date" | "immediate">("weekly_recurring");
  const [targetDate, setTargetDate] = useState(getTodayDateString);
  const [recurrenceDay, setRecurrenceDay] = useState("1"); // 1 = Monday
  const [occurrencesPerDay, setOccurrencesPerDay] = useState(5); // Default 5 times a day
  const [startTime, setStartTime] = useState(getCurrentTimeString);
  const [endTime, setEndTime] = useState("23:00");

  const [subject, setSubject] = useState("💬 Work Reminder: Creative Deliverables Update");
  const [message, setMessage] = useState("Hi team,\n\nThis is an automated WhatsApp reminder regarding today's creative deliverables review. Please complete and submit your work on time.");

  useEffect(() => {
    setStartTime(getCurrentTimeString());
  }, []);

  const assignedEmployees = selectedClient
    ? employees.filter((emp) =>
        assignments.some((a) => a.client_id === selectedClient && a.user_id === emp.id)
      )
    : [];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setIsSentSuccess(false);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await createWhatsAppAlert(formData);
      if (response.error) {
        setResult({ error: response.error });
        setIsSentSuccess(false);
      } else {
        setIsSentSuccess(true);
        setResult({
          success: true,
          message: response.message || "WhatsApp alert scheduled successfully!",
          whatsappUrl: response.whatsappUrl,
        });

        // Automatically open WhatsApp Web window if immediate
        if (response.whatsappUrl && scheduleType === "immediate") {
          window.open(response.whatsappUrl, "_blank");
        }

        setTimeout(() => setIsSentSuccess(false), 6000);
      }
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this WhatsApp alert?")) return;
    const res = await deleteWhatsAppAlert(id);
    if (res?.success) {
      setAlertsList(alertsList.filter((a) => a.id !== id));
    } else if (res?.error) {
      alert(res.error);
    }
  }

  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][Number(recurrenceDay)] || "Monday";

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-16 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
          <MessageSquare className="text-emerald-400" size={24} />
          WhatsApp Alerts
        </h1>
        <p className="text-neutral-400 text-sm mt-1">
          Send automated or 1-click WhatsApp notifications to your team members and clients for free.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-xl">
        {/* Recipient Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              1. Team Recipient & Phone Number
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecipientMode("employee")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  recipientMode === "employee"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-neutral-800 text-neutral-400 bg-neutral-950 hover:text-white"
                }`}
              >
                Team Member List
              </button>
              <button
                type="button"
                onClick={() => setRecipientMode("custom")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  recipientMode === "custom"
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-neutral-800 text-neutral-400 bg-neutral-950 hover:text-white"
                }`}
              >
                Custom Phone Number
              </button>
            </div>
          </div>
          <input type="hidden" name="recipient_mode" value={recipientMode} />

          {recipientMode === "employee" ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Filter by Client (Optional)
                </label>
                <select
                  name="client_id"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Clients ({clients.length})</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Select Team Member *
                </label>
                <select
                  name="recipient_id"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required={recipientMode === "employee"}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL_TEAM">👥 All Team Members (Send to Everyone)</option>

                  {selectedClient && assignedEmployees.length > 0 && (
                    <optgroup label={`Assigned to ${clients.find((c) => c.id === selectedClient)?.name || "Client"}`}>
                      {assignedEmployees.map((emp) => (
                        <option key={`assigned-${emp.id}`} value={emp.id}>
                          ⭐ {emp.name} ({emp.email}) {emp.id === currentUserId ? "— (You)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label="All Team Members">
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email}) {emp.id === currentUserId ? "— (You)" : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          ) : null}

          {/* Phone Number Input (Default: 918341928526) */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                WhatsApp Phone Number * <span className="text-[10px] text-emerald-400 font-normal">(Default: 918341928526)</span>
              </label>
              <input
                name="recipient_phone"
                type="tel"
                required
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="918341928526"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">Recipient Name</label>
              <input
                name="recipient_name"
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Shiva Shankar"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Schedule Mode & Timing Settings */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            2. Schedule, Day of Week, Occurrences & Time Window
          </label>

          {/* Schedule Mode Toggles */}
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setScheduleType("weekly_recurring")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "weekly_recurring"
                  ? "bg-emerald-600/10 border-emerald-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Repeat size={16} className="mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">🔄 Day of Week (Weekly)</div>
                <div className="text-[11px] text-neutral-400">Repeat on Monday, Tuesday, etc.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType("specific_date")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "specific_date"
                  ? "bg-emerald-600/10 border-emerald-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Calendar size={16} className="mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">📅 Specific Date</div>
                <div className="text-[11px] text-neutral-400">Target a date (e.g. Sept 7th)</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleType("immediate")}
              className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                scheduleType === "immediate"
                  ? "bg-emerald-600/10 border-emerald-500 text-white"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Send size={16} className="mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">⚡ Send Right Now</div>
                <div className="text-[11px] text-neutral-400">Launch 1-Click WhatsApp immediately</div>
              </div>
            </button>
          </div>
          <input type="hidden" name="schedule_type" value={scheduleType} />

          {scheduleType !== "immediate" && (
            <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Day of Week OR Specific Date */}
                {scheduleType === "weekly_recurring" ? (
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Day of the Week *</label>
                    <select
                      name="recurrence_day"
                      value={recurrenceDay}
                      onChange={(e) => setRecurrenceDay(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
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
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">Target Date *</label>
                    <input
                      type="date"
                      name="target_date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      required={scheduleType === "specific_date"}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                {/* Occurrence per day */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Occurrences on That Day *</label>
                  <select
                    name="occurrences_per_day"
                    value={occurrencesPerDay}
                    onChange={(e) => setOccurrencesPerDay(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1">1 time on that day</option>
                    <option value="2">2 times on that day</option>
                    <option value="3">3 times on that day</option>
                    <option value="4">4 times on that day</option>
                    <option value="5">5 times on that day (e.g. 5x on Monday)</option>
                    <option value="6">6 times on that day</option>
                    <option value="8">8 times on that day</option>
                    <option value="10">10 times on that day</option>
                  </select>
                </div>

                {/* Starting Time (Default: Current Time) */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Starting Time * <span className="text-[10px] text-emerald-400 font-normal">(Defaults to Current Time)</span>
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>

                {/* Ending Time */}
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">Ending Time *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
              </div>

              {/* Schedule Summary Banner */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Clock size={14} className="shrink-0 text-emerald-400" />
                <span>
                  {scheduleType === "weekly_recurring"
                    ? `WhatsApp notification will repeat ${occurrencesPerDay} times every ${dayName} between ${startTime} and ${endTime}.`
                    : `WhatsApp notification will repeat ${occurrencesPerDay} times on ${targetDate} between ${startTime} and ${endTime}.`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Content */}
        <div className="space-y-4 pt-4 border-t border-neutral-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            3. WhatsApp Message Content
          </label>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">Alert Title / Subject *</label>
            <input
              name="subject"
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter WhatsApp alert title..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
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
              placeholder="Write your WhatsApp message here..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y font-sans"
            />
          </div>
        </div>

        {/* Status Messages & Direct 1-Click Link */}
        {result?.error && (
          <div className="p-3.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>{result.error}</div>
          </div>
        )}

        {result?.success && (
          <div className="p-4 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <CheckCircle2 size={18} className="shrink-0" />
              {result.message}
            </div>

            {result.whatsappUrl && (
              <div className="pt-2 border-t border-emerald-800/60 flex items-center justify-between">
                <span className="text-emerald-300">Launch pre-filled message on WhatsApp:</span>
                <a
                  href={result.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-all"
                >
                  <ExternalLink size={14} /> Open WhatsApp Now (+{customPhone})
                </a>
              </div>
            )}
          </div>
        )}

        {/* Action Button: Turns GREEN on success */}
        <div>
          <button
            disabled={isPending}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg cursor-pointer ${
              isSentSuccess
                ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-900/30 scale-[1.02]"
                : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-900/20"
            } disabled:opacity-50`}
          >
            {isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isSentSuccess ? (
              <Check size={16} className="stroke-[3]" />
            ) : (
              <MessageSquare size={16} />
            )}
            {isPending
              ? "Generating WhatsApp Alert..."
              : isSentSuccess
              ? "✓ WhatsApp Alert Created Successfully!"
              : scheduleType === "immediate"
              ? "Send WhatsApp Alert Now"
              : "Send WhatsApp Alert"}
          </button>
        </div>
      </form>

      {/* Log */}
      <section className="space-y-3 pt-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock size={16} className="text-neutral-400" /> Recent & Scheduled WhatsApp Alerts
        </h2>

        {alertsList.length === 0 ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm">
            No WhatsApp alerts scheduled yet. Use the form above to launch your first WhatsApp alert!
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
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                        ⚡ {alertItem.occurrences_per_day}x daily (Sent {alertItem.sent_count || 0}/{alertItem.occurrences_per_day})
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400 truncate">
                    Phone: <span className="font-mono text-emerald-300">{alertItem.recipient_phone || "918341928526"}</span> ({alertItem.recipient_name || alertItem.recipient?.name || "Shiva Shankar"})
                  </p>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{alertItem.message}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {alertItem.recipient_phone && (
                    <a
                      href={`https://wa.me/${alertItem.recipient_phone}?text=${encodeURIComponent(`*${alertItem.subject}*\n\n${alertItem.message}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Launch WhatsApp Web"
                    >
                      <ExternalLink size={12} /> WhatsApp
                    </a>
                  )}

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

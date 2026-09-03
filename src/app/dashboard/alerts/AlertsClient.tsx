"use client";

import { useState, useTransition } from "react";
import { Bell, Loader2, Send } from "lucide-react";
import { createEmailAlert } from "@/app/actions/alerts";

type Employee = { id: string; name: string; email: string };
type Alert = {
  id: string;
  subject: string;
  message: string;
  scheduled_for: string;
  status: string;
  recipient?: { name: string; email: string } | null;
};

export default function AlertsClient({ employees, alerts }: { employees: Employee[]; alerts: Alert[] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    const form = event.currentTarget;
    startTransition(async () => {
      const response = await createEmailAlert(new FormData(form));
      setResult(response.error || (response.status === "sent" ? "Email sent." : "Alert scheduled."));
      if (!response.error) form.reset();
    });
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-16">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2"><Bell size={20} /> Alerts</h1>
          <p className="text-neutral-500 text-sm mt-1">Send a private email to an employee now or later.</p>
        </div>

        <form onSubmit={submit} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-sm text-neutral-300">
              Employee
              <select name="recipient_id" required className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-white">
                <option value="">Choose an employee</option>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name} ({employee.email})</option>)}
              </select>
            </label>
            <label className="space-y-1.5 text-sm text-neutral-300">
              Send time
              <input name="scheduled_for" type="datetime-local" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-white" />
              <span className="block text-xs text-neutral-500">Leave empty to send immediately.</span>
            </label>
          </div>
          <label className="block space-y-1.5 text-sm text-neutral-300">
            Subject
            <input name="subject" required maxLength={200} placeholder="A quick message from the team" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-white" />
          </label>
          <label className="block space-y-1.5 text-sm text-neutral-300">
            Message
            <textarea name="message" required rows={5} placeholder="Write your message here..." className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2.5 text-white resize-y" />
          </label>
          {result && <p className="text-sm text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2">{result}</p>}
          <button disabled={isPending || employees.length === 0} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {isPending ? "Sending..." : "Send Alert"}
          </button>
          {employees.length === 0 && <p className="text-xs text-amber-400">There are no active employees with email addresses.</p>}
        </form>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">Recent alerts</h2>
          {alerts.length === 0 ? <p className="text-sm text-neutral-500">No alerts yet.</p> : alerts.map((alert) => (
            <div key={alert.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{alert.subject}</p><p className="text-xs text-neutral-500 mt-1">To {alert.recipient?.name || "employee"} ({alert.recipient?.email || "no email"})</p><p className="text-sm text-neutral-400 mt-2 whitespace-pre-wrap">{alert.message}</p></div>
              <span className="text-xs capitalize text-neutral-400 shrink-0">{alert.status}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
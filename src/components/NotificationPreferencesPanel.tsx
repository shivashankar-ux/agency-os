"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  Volume2,
  Vibrate,
  Save,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationPreferences {
  task_assigned: boolean;
  task_completed: boolean;
  task_overdue: boolean;
  task_due_soon: boolean;
  task_comment: boolean;
  task_mentioned: boolean;
  project_updated: boolean;
  project_deadline: boolean;
  team_member_added: boolean;
  team_mention: boolean;
  invoice_paid: boolean;
  invoice_overdue: boolean;
  payment_received: boolean;
  siren_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

const defaultPrefs: NotificationPreferences = {
  task_assigned: true,
  task_completed: false,
  task_overdue: true,
  task_due_soon: true,
  task_comment: true,
  task_mentioned: true,
  project_updated: false,
  project_deadline: true,
  team_member_added: false,
  team_mention: true,
  invoice_paid: true,
  invoice_overdue: true,
  payment_received: true,
  siren_enabled: true,
  vibration_enabled: true,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  timezone: "UTC",
};

const sections = [
  {
    title: "Task Notifications",
    icon: AlertCircle,
    keys: [
      { key: "task_assigned", label: "Task Assigned to You", desc: "Someone assigns you a new task" },
      { key: "task_completed", label: "Task Completed", desc: "A task you created or own is completed" },
      { key: "task_overdue", label: "Task Overdue", desc: "A task you own goes past its due date" },
      { key: "task_due_soon", label: "Task Due Soon (24h)", desc: "Reminder before a task deadline" },
      { key: "task_comment", label: "Task Comment", desc: "Someone comments on your task" },
      { key: "task_mentioned", label: "You're Mentioned", desc: "Someone @mentions you in a task" },
    ],
  },
  {
    title: "Project Notifications",
    icon: AlertCircle,
    keys: [
      { key: "project_updated", label: "Project Updated", desc: "Changes to projects you own" },
      { key: "project_deadline", label: "Project Deadline", desc: "Upcoming project deadlines" },
    ],
  },
  {
    title: "Team Notifications",
    icon: AlertCircle,
    keys: [
      { key: "team_member_added", label: "New Team Member", desc: "Someone joins your team" },
      { key: "team_mention", label: "Team Mention", desc: "You're mentioned in team chat" },
    ],
  },
  {
    title: "Finance Notifications",
    icon: AlertCircle,
    keys: [
      { key: "invoice_paid", label: "Invoice Paid", desc: "Client pays an invoice" },
      { key: "invoice_overdue", label: "Invoice Overdue", desc: "An invoice goes past due date" },
      { key: "payment_received", label: "Payment Received", desc: "Any payment received" },
    ],
  },
];

export function NotificationPreferencesPanel() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPrefs({
          task_assigned: data.task_assigned,
          task_completed: data.task_completed,
          task_overdue: data.task_overdue,
          task_due_soon: data.task_due_soon,
          task_comment: data.task_comment,
          task_mentioned: data.task_mentioned,
          project_updated: data.project_updated,
          project_deadline: data.project_deadline,
          team_member_added: data.team_member_added,
          team_mention: data.team_mention,
          invoice_paid: data.invoice_paid,
          invoice_overdue: data.invoice_overdue,
          payment_received: data.payment_received,
          siren_enabled: data.siren_enabled,
          vibration_enabled: data.vibration_enabled,
          quiet_hours_start: data.quiet_hours_start || "22:00",
          quiet_hours_end: data.quiet_hours_end || "08:00",
          timezone: data.timezone || "UTC",
        });
      }
    } catch (err) {
      console.error("Load preferences error:", err);
      setError("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          task_assigned: prefs.task_assigned,
          task_completed: prefs.task_completed,
          task_overdue: prefs.task_overdue,
          task_due_soon: prefs.task_due_soon,
          task_comment: prefs.task_comment,
          task_mentioned: prefs.task_mentioned,
          project_updated: prefs.project_updated,
          project_deadline: prefs.project_deadline,
          team_member_added: prefs.team_member_added,
          team_mention: prefs.team_mention,
          invoice_paid: prefs.invoice_paid,
          invoice_overdue: prefs.invoice_overdue,
          payment_received: prefs.payment_received,
          siren_enabled: prefs.siren_enabled,
          vibration_enabled: prefs.vibration_enabled,
          quiet_hours_start: prefs.quiet_hours_start,
          quiet_hours_end: prefs.quiet_hours_end,
          timezone: prefs.timezone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      console.error("Save preferences error:", err);
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-12 bg-neutral-800/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-600/20 rounded-xl">
            <Bell className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Notification Settings</h3>
            <p className="text-xs text-neutral-500">Control which events trigger push notifications</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.siren_enabled}
              onChange={() => togglePref("siren_enabled")}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <Volume2 className="w-4 h-4 text-indigo-400 inline-block mr-1" />
              <span className="text-white font-medium">Siren Sound</span>
              <p className="text-xs text-neutral-500">Loud siren for urgent alerts</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.vibration_enabled}
              onChange={() => togglePref("vibration_enabled")}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <Vibrate className="w-4 h-4 text-indigo-400 inline-block mr-1" />
              <span className="text-white font-medium">Vibration</span>
              <p className="text-xs text-neutral-500">Haptic feedback with notifications</p>
            </div>
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">
              Quiet Hours Start
            </label>
            <input
              type="time"
              value={prefs.quiet_hours_start}
              onChange={(e) => setPrefs(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">
              Quiet Hours End
            </label>
            <input
              type="time"
              value={prefs.quiet_hours_end}
              onChange={(e) => setPrefs(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs text-neutral-500 uppercase tracking-wider mb-1 block">
            Timezone
          </label>
          <select
            value={prefs.timezone}
            onChange={(e) => setPrefs(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Kolkata">Kolkata (IST)</option>
            <option value="Australia/Sydney">Sydney (AEST)</option>
          </select>
        </div>
      </motion.div>

      {/* Notification Categories */}
      {sections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.05 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5"
        >
          <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
            <section.icon className="w-4 h-4 text-indigo-400" />
            {section.title}
          </h4>

          <div className="space-y-3">
            {section.keys.map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between gap-4 cursor-pointer group">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => togglePref(key as keyof NotificationPreferences)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
                    prefs[key as keyof NotificationPreferences]
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-neutral-700 bg-neutral-800"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-neutral-900`}
                  role="switch"
                  aria-checked={prefs[key as keyof NotificationPreferences] ? "true" : "false"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      prefs[key as keyof NotificationPreferences] ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-neutral-800">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="btn-touch flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Preferences
            </>
          )}
        </button>
      </div>

      {saved && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle className="w-4 h-4" />
            Preferences saved
          </motion.div>
        </AnimatePresence>
      )}

      {error && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 z-50"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

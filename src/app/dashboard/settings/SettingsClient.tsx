"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, CheckSquare, FileText, Layout, Save, Plus, Trash2, CheckCircle2, Circle
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  role: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type SettingsClientProps = {
  profile: Profile;
};

export default function SettingsClient({ profile }: SettingsClientProps) {
  // 1. Dashboard Widget Visibility Settings (State & Initialization)
  const [widgets, setWidgets] = useState({
    kpis: true,
    quickActions: true,
    charts: true,
    projects: true,
    timeline: true,
    todaySchedule: true,
    notifications: true,
    leaderboards: true,
    notesChecklist: true,
  });

  // 2. Personal Note State
  const [personalNotes, setPersonalNotes] = useState("");
  
  // 3. Checklist State
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTodoText, setNewTodoText] = useState("");

  const [activeSubTab, setActiveSubTab] = useState<"widgets" | "notes">("widgets");

  // Load from local storage
  useEffect(() => {
    // Widgets
    const storedWidgets = localStorage.getItem("dashboard_widgets_visibility");
    if (storedWidgets) {
      try {
        setWidgets(JSON.parse(storedWidgets));
      } catch (e) {
        console.error("Failed to parse widgets settings:", e);
      }
    }

    // Notes
    const storedNotes = localStorage.getItem("personal_dashboard_notes");
    if (storedNotes) {
      setPersonalNotes(storedNotes);
    }

    // Checklist
    const storedChecklist = localStorage.getItem("personal_dashboard_checklist");
    if (storedChecklist) {
      try {
        setChecklist(JSON.parse(storedChecklist));
      } catch (e) {
        console.error("Failed to parse checklist:", e);
      }
    }
  }, []);

  // Save widgets settings
  const toggleWidget = (key: keyof typeof widgets) => {
    const updated = { ...widgets, [key]: !widgets[key] };
    setWidgets(updated);
    localStorage.setItem("dashboard_widgets_visibility", JSON.stringify(updated));
  };

  // Autosave notes on change
  const handleNotesChange = (val: string) => {
    setPersonalNotes(val);
    localStorage.setItem("personal_dashboard_notes", val);
  };

  // Checklist utilities
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false
    };

    const updated = [...checklist, newItem];
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
    setNewTodoText("");
  };

  const toggleTodo = (id: string) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
  };

  const deleteTodo = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    localStorage.setItem("personal_dashboard_checklist", JSON.stringify(updated));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sub navigation column */}
      <div className="lg:col-span-3 space-y-2">
        <button
          onClick={() => setActiveSubTab("widgets")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left border ${
            activeSubTab === "widgets"
              ? "bg-neutral-900 text-white border-neutral-800 shadow"
              : "text-neutral-500 hover:bg-neutral-900/50 hover:text-white border-transparent"
          }`}
        >
          <Layout size={14} className={activeSubTab === "widgets" ? "text-indigo-400" : ""} />
          Dashboard Layout Customizer
        </button>
        <button
          onClick={() => setActiveSubTab("notes")}
          className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left border ${
            activeSubTab === "notes"
              ? "bg-neutral-900 text-white border-neutral-800 shadow"
              : "text-neutral-500 hover:bg-neutral-900/50 hover:text-white border-transparent"
          }`}
        >
          <CheckSquare size={14} className={activeSubTab === "notes" ? "text-indigo-400" : ""} />
          Personal Notes & Checklist
        </button>
      </div>

      {/* Main Settings Panel */}
      <div className="lg:col-span-9">
        {activeSubTab === "widgets" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6"
          >
            <div>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Layout size={16} className="text-indigo-450" />
                Customize Dashboard Layout
              </h2>
              <p className="text-neutral-500 text-[11px] mt-1">
                Choose which widgets are shown when you load your dashboard overview screen. Settings save automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                { key: "kpis", label: "Overview Metrics Card Grid", desc: "Displays stats for clients, active projects, and pending tasks" },
                { key: "quickActions", label: "Quick Actions Panel", desc: "Shortcuts to create clients, invites, projects, or calendar events" },
                { key: "charts", label: "Task Analysis Charts", desc: "Bar/pie charts representing tasks status and priority distribution" },
                { key: "projects", label: "Projects Progress list", desc: "Shows project completion percentage, health status, and due dates" },
                { key: "timeline", label: "Recent Activity Feed", desc: "Chronological log of modifications, completions, and invitations" },
                { key: "todaySchedule", label: "Today's Schedule & Deadlines", desc: "Unified list of calendar meetings, tasks, and project milestones due today" },
                { key: "notifications", label: "Alerts & Notifications Feed", desc: "Dynamic list of upcoming due dates, warnings, and system alerts" },
                { key: "leaderboards", label: "Performance & Delayed Projects", desc: "Shows top-performing members and delayed client work tables" },
                { key: "notesChecklist", label: "Notes & Checklist Widget", desc: "Displays your personal note notebook and checklist tasks on the dashboard" },
              ].map((item) => {
                const widgetKey = item.key as keyof typeof widgets;
                const isChecked = widgets[widgetKey];

                return (
                  <div
                    key={item.key}
                    onClick={() => toggleWidget(widgetKey)}
                    className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? "bg-neutral-950/80 border-neutral-800 shadow-inner"
                        : "bg-neutral-950/20 border-neutral-900/60 opacity-60 hover:opacity-85 hover:border-neutral-850"
                    }`}
                  >
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      className={`relative w-8 h-4.5 rounded-full p-0.5 shrink-0 mt-0.5 transition-colors duration-250 cursor-pointer ${
                        isChecked ? "bg-indigo-600" : "bg-neutral-800"
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-white transition-transform duration-250 ${
                          isChecked ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div>
                      <p className="text-white font-semibold text-xs leading-snug">{item.label}</p>
                      <p className="text-neutral-500 text-[10px] mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Notepad */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} className="text-indigo-400" />
                  Personal Notepad
                </h3>
                <span className="text-[10px] text-neutral-500 font-semibold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">Autosaved</span>
              </div>
              <textarea
                value={personalNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Write down draft ideas, notes, links, phone numbers... anything you need to refer to later!"
                className="flex-1 bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3.5 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Checklist */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 flex flex-col min-h-[400px]">
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare size={14} className="text-indigo-400" />
                  Personal Checklist / TODOs
                </h3>
              </div>

              {/* Add Todo input */}
              <form onSubmit={handleAddTodo} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a checklist task..."
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-neutral-700 font-sans"
                />
                <button
                  type="submit"
                  disabled={!newTodoText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-600 disabled:opacity-50 text-white-literal px-3 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus size={16} />
                </button>
              </form>

              {/* Checklist list */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                {checklist.length === 0 ? (
                  <div className="text-center py-12 text-xxs text-neutral-500 italic">
                    Your checklist is empty. Add a task above to get started!
                  </div>
                ) : (
                  checklist.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                        item.completed
                          ? "bg-neutral-950/30 border-neutral-850/50 opacity-60"
                          : "bg-neutral-950 border-neutral-800/80"
                      }`}
                    >
                      <button
                        onClick={() => toggleTodo(item.id)}
                        className="flex items-center gap-2.5 text-left flex-1 select-none cursor-pointer"
                      >
                        {item.completed ? (
                          <CheckCircle2 size={15} className="text-indigo-400 shrink-0" />
                        ) : (
                          <Circle size={15} className="text-neutral-500 hover:text-indigo-400 shrink-0" />
                        )}
                        <span className={`text-xs ${item.completed ? "line-through text-neutral-500" : "text-neutral-200"}`}>
                          {item.text}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteTodo(item.id)}
                        className="text-neutral-600 hover:text-red-400 p-1 rounded transition-colors shrink-0 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

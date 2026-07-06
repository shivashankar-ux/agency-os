"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  BarChart3, Download, TrendingUp, DollarSign, Wallet, Percent,
  Users, CheckSquare, Briefcase, FileText, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────
type Invoice = {
  id: string;
  invoice_number?: string;
  amount: number;
  gst_amount?: number;
  total_amount: number;
  status: string;
  issue_date: string;
  client?: { name: string } | null;
};

type Expense = {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
  client?: { name: string } | null;
};

type Task = {
  id: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  assignee?: { name: string } | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
};

type Profile = { id: string; name: string };

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6"];

function fmt(val: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
}

export default function ReportsPageClient({
  invoices,
  expenses,
  tasks,
  projects,
  profiles,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  tasks: Task[];
  projects: Project[];
  profiles: Profile[];
}) {
  const [activeReport, setActiveReport] = useState<"finance" | "team" | "projects">("finance");

  // ── Financial Data Crunching ──────────────────────────────────
  const financialStats = useMemo(() => {
    const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total_amount, 0);
    const outstandingRevenue = invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.total_amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    // Monthly Collections & Expenses mapping
    const monthlyMap: Record<string, { month: string; Revenue: number; Expenses: number }> = {};
    invoices.forEach(i => {
      if (i.status !== "paid" || !i.issue_date) return;
      const month = i.issue_date.slice(0, 7); // YYYY-MM
      if (!monthlyMap[month]) monthlyMap[month] = { month, Revenue: 0, Expenses: 0 };
      monthlyMap[month].Revenue += i.total_amount;
    });
    expenses.forEach(e => {
      if (!e.expense_date) return;
      const month = e.expense_date.slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { month, Revenue: 0, Expenses: 0 };
      monthlyMap[month].Expenses += Number(e.amount);
    });

    const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

    // Expense Categories pie chart
    const expenseMap: Record<string, number> = {};
    expenses.forEach(e => {
      expenseMap[e.category] = (expenseMap[e.category] || 0) + Number(e.amount);
    });
    const expenseCategories = Object.entries(expenseMap).map(([name, value]) => ({ name, value }));

    return { totalRevenue, outstandingRevenue, totalExpenses, netProfit, profitMargin, monthlyTrends, expenseCategories };
  }, [invoices, expenses]);

  // ── Team Data Crunching ───────────────────────────────────────
  const teamStats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === "done").length;
    const pendingTasks = totalTasks - completedTasks;

    // Tasks workload distribution per profile
    const workloadMap: Record<string, { name: string; Completed: number; Pending: number }> = {};
    profiles.forEach(p => {
      workloadMap[p.id] = { name: p.name, Completed: 0, Pending: 0 };
    });
    tasks.forEach(t => {
      if (!t.assigned_to || !workloadMap[t.assigned_to]) return;
      if (t.status === "done") {
        workloadMap[t.assigned_to].Completed += 1;
      } else {
        workloadMap[t.assigned_to].Pending += 1;
      }
    });

    const workloadData = Object.values(workloadMap).filter(w => w.Completed > 0 || w.Pending > 0);

    return { totalTasks, completedTasks, pendingTasks, workloadData };
  }, [tasks, profiles]);

  // ── Project Data Crunching ────────────────────────────────────
  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const active = projects.filter(p => p.status === "active").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const onHold = projects.filter(p => p.status === "on_hold").length;

    const projectStatuses = [
      { name: "Active", value: active },
      { name: "Completed", value: completed },
      { name: "On Hold", value: onHold },
    ].filter(s => s.value > 0);

    return { totalProjects, active, completed, onHold, projectStatuses };
  }, [projects]);

  // ── Export CSV Handler ────────────────────────────────────────
  function exportCSV() {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = "";

    if (activeReport === "finance") {
      filename = "finance_report.csv";
      headers = ["Invoice Number", "Client", "Issue Date", "Status", "Amount", "GST", "Total Amount"];
      rows = invoices.map(i => [
        i.invoice_number || "",
        i.client?.name || "",
        i.issue_date || "",
        i.status || "",
        String(i.amount || 0),
        String(i.gst_amount || 0),
        String(i.total_amount || 0)
      ]);
    } else if (activeReport === "team") {
      filename = "team_productivity.csv";
      headers = ["Teammate Name", "Tasks Completed", "Tasks Pending", "Total Assignments"];
      rows = teamStats.workloadData.map(w => [
        w.name,
        String(w.Completed),
        String(w.Pending),
        String(w.Completed + w.Pending)
      ]);
    } else {
      filename = "project_report.csv";
      headers = ["Project Name", "Status"];
      rows = projects.map(p => [p.name, p.status]);
    }

    const csvContent = [headers.join(","), ...rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-neutral-950 p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-400" />
            Analytics Reports
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            Evaluate performance, check margins, and monitor teammate workload.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
        >
          <Download size={14} /> Export Sheet
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-900">
        {[
          { key: "finance", label: "Financial Metrics", icon: DollarSign },
          { key: "team", label: "Team Productivity", icon: Users },
          { key: "projects", label: "Project Statuses", icon: Briefcase },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveReport(t.key as any)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg flex items-center gap-1.5 border-b border-transparent transition-colors -mb-px
              ${activeReport === t.key ? "bg-neutral-900 text-white border-b-indigo-500 border border-neutral-800 border-b-transparent" : "text-neutral-500 hover:text-white"}`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Pages */}
      <AnimatePresence mode="wait">
        {activeReport === "finance" && (
          <motion.div
            key="finance"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-6"
          >
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { label: "Total Revenue", value: fmt(financialStats.totalRevenue), desc: "Paid Collections", icon: DollarSign, color: "text-emerald-400" },
                { label: "Total Expenses", value: fmt(financialStats.totalExpenses), desc: "Operational Outflow", icon: Wallet, color: "text-red-400" },
                { label: "Profit Margin", value: `${financialStats.profitMargin}%`, desc: "Revenue Efficiency", icon: Percent, color: "text-indigo-400" },
                { label: "Outstanding Invoices", value: fmt(financialStats.outstandingRevenue), desc: "Uncollected Balances", icon: FileText, color: "text-yellow-400" },
              ].map((k) => (
                <div key={k.label} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">{k.label}</p>
                    <p className="text-lg font-bold text-white mt-1.5">{k.value}</p>
                    <p className="text-neutral-600 text-xxs mt-0.5">{k.desc}</p>
                  </div>
                  <k.icon size={22} className={k.color} />
                </div>
              ))}
            </div>

            {/* Trends & Category Share */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Line Chart */}
              <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">Revenue vs Expenses Over Time</h3>
                  <p className="text-neutral-500 text-xxs mt-0.5">Chronological summary of Collections against Expenses</p>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialStats.monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#404040" fontSize={10} tickLine={false} />
                      <YAxis stroke="#404040" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: "#171717", borderColor: "#262626" }} labelStyle={{ color: "#fff", fontSize: 11 }} itemStyle={{ fontSize: 11 }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                      <Area name="Revenue" type="monotone" dataKey="Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" />
                      <Area name="Expenses" type="monotone" dataKey="Expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart Expense breakdown */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">Expense Share</h3>
                  <p className="text-neutral-500 text-xxs mt-0.5">Expenses categorized by department allocation</p>
                </div>
                <div className="h-56 flex items-center justify-center">
                  {financialStats.expenseCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={financialStats.expenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {financialStats.expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(Number(v))} contentStyle={{ backgroundColor: "#171717", borderColor: "#262626" }} itemStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-neutral-600 text-xs italic">No expenses recorded</p>
                  )}
                </div>
                {/* Legend list */}
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {financialStats.expenseCategories.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between text-xxs">
                      <span className="flex items-center gap-1.5 text-neutral-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        {c.name}
                      </span>
                      <span className="text-white font-bold">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeReport === "team" && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-6"
          >
            {/* Team stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">Total Tasks Logged</p>
                <p className="text-2xl font-extrabold text-white mt-1.5">{teamStats.totalTasks}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">Completed Tasks</p>
                <p className="text-2xl font-extrabold text-emerald-400 mt-1.5">{teamStats.completedTasks}</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
                <p className="text-neutral-500 text-xxs font-semibold uppercase tracking-wider">Pending Workload</p>
                <p className="text-2xl font-extrabold text-indigo-400 mt-1.5">{teamStats.pendingTasks}</p>
              </div>
            </div>

            {/* Workload chart */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Teammate Workload Distribution</h3>
                <p className="text-neutral-500 text-xxs mt-0.5">Comparison of active assignments and task completions per employee</p>
              </div>
              <div className="h-80">
                {teamStats.workloadData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={teamStats.workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#404040" fontSize={10} tickLine={false} />
                      <YAxis stroke="#404040" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#171717", borderColor: "#262626" }} labelStyle={{ color: "#fff", fontSize: 11 }} itemStyle={{ fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar name="Tasks Completed" dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar name="Tasks Pending" dataKey="Pending" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-600 text-xs italic">
                    No task assignments mapped yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeReport === "projects" && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Status breakdown metrics */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Project Portfolio Summary</h3>
                <p className="text-neutral-500 text-xxs mt-0.5">Status breakdown of all client contracts</p>
              </div>

              <div className="h-52 flex items-center justify-center">
                {projectStats.projectStatuses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStats.projectStatuses}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {projectStats.projectStatuses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#171717", borderColor: "#262626" }} itemStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-600 text-xs italic">No projects created yet</p>
                )}
              </div>

              {/* Status details */}
              <div className="space-y-2 pt-2">
                {[
                  { label: "Active Projects", val: projectStats.active, color: "bg-indigo-500" },
                  { label: "Completed Projects", val: projectStats.completed, color: "bg-emerald-500" },
                  { label: "On Hold Projects", val: projectStats.onHold, color: "bg-amber-500" },
                ].map((s, i) => (
                  <div key={s.label} className="flex items-center justify-between text-xxs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.label}
                    </span>
                    <span className="text-white font-bold">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Project List status tracker */}
            <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Active Workspace Logs</h3>
                <p className="text-neutral-500 text-xxs mt-0.5">Quick lookup of running project scopes</p>
              </div>
              <div className="divide-y divide-neutral-800/60 max-h-72 overflow-y-auto pr-1">
                {projects.map((p) => (
                  <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <span className="text-white font-medium">{p.name}</span>
                    <span className={`text-xxs px-2 py-0.5 rounded border capitalize font-semibold
                      ${p.status === "completed" ? "bg-emerald-950 text-emerald-400 border-emerald-900" : p.status === "active" ? "bg-indigo-950 text-indigo-400 border-indigo-900" : "bg-neutral-800 text-neutral-400 border-neutral-700"}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

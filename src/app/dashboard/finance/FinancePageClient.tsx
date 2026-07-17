"use client";

import { useState } from "react";
import { usePermissions } from "@/app/dashboard/components/PermissionProvider";
import { createClient } from "@/lib/supabase/client";
import { 
  Wallet, DollarSign, Receipt, AlertTriangle, FilePlus, Search, 
  Filter, Calendar, FileText, CheckCircle, Clock, X, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import CreateInvoiceModal from "./CreateInvoiceModal";
import { updateInvoiceStatus } from "@/app/actions/finance";

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issue_date: string;
  due_date: string | null;
  client_id: string;
  clients: { name: string } | null;
}

interface ClientOption {
  id: string;
  name: string;
}

interface FinancePageClientProps {
  initialInvoices: Invoice[];
  clients: ClientOption[];
}

export default function FinancePageClient({ initialInvoices, clients }: FinancePageClientProps) {
  const supabase = createClient();
  const { canCreate, canEdit, hasPermission } = usePermissions();

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // KPIs
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const overdueRevenue = invoices
    .filter((i) => i.status === "overdue")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const draftRevenue = invoices
    .filter((i) => i.status === "draft")
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  // Filtered invoices
  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch = 
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.clients?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Recharts Chart Data (group by issue_date month)
  const monthlyDataMap: Record<string, number> = {};
  invoices
    .filter((i) => i.status === "paid")
    .forEach((i) => {
      if (!i.issue_date) return;
      const month = new Date(i.issue_date).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthlyDataMap[month] = (monthlyDataMap[month] || 0) + Number(i.total_amount || 0);
    });

  const chartData = Object.keys(monthlyDataMap).map((month) => ({
    name: month,
    Revenue: monthlyDataMap[month],
  })).sort((a, b) => {
    // Sort chronological: compare dates parsed from short format
    return new Date(a.name).getTime() - new Date(b.name).getTime();
  });

  async function handleStatusChange(invoiceId: string, nextStatus: "draft" | "sent" | "paid" | "overdue") {
    if (!canEdit("finance")) return;

    try {
      const res = await updateInvoiceStatus(invoiceId, nextStatus);

      if (res.error) throw new Error(res.error);

      // Optimistic update
      setInvoices((prev) =>
        prev.map((i) => (i.id === invoiceId ? { ...i, status: nextStatus } : i))
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  }

  const statusColors = {
    paid: "bg-emerald-950 text-emerald-400 border-emerald-900/50",
    sent: "bg-yellow-950 text-yellow-400 border-yellow-900/50",
    overdue: "bg-red-950 text-red-400 border-red-900/50",
    draft: "bg-neutral-800 text-neutral-400 border-neutral-700",
  };

  return (
    <div className="space-y-6">
      {/* Header Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-850 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="text-indigo-400" size={24} />
            Finance & Revenue
          </h1>
          <p className="text-neutral-500 text-xs mt-1.5">
            Manage paid client invoices, pending collections, and financial analytics.
          </p>
        </div>

        {canCreate("finance") && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white-literal font-semibold text-xs px-3.5 py-2 rounded-lg transition-all"
          >
            <FilePlus size={14} />
            Create Invoice
          </button>
        )}
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-750 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold tracking-wide uppercase">
            <span>Paid Revenue</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight mt-3">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950 border border-emerald-900/40 px-2 py-0.2 rounded-md mt-2 inline-block">
            Cleared cash
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-750 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold tracking-wide uppercase">
            <span>Outstanding (Sent)</span>
            <Clock size={16} className="text-yellow-400" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight mt-3">
            ₹{pendingRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-yellow-400 font-semibold bg-yellow-950 border border-yellow-900/40 px-2 py-0.2 rounded-md mt-2 inline-block">
            Invoiced collections
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-750 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold tracking-wide uppercase">
            <span>Overdue Invoices</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight mt-3">
            ₹{overdueRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-red-400 font-semibold bg-red-950 border border-red-900/40 px-2 py-0.2 rounded-md mt-2 inline-block">
            Past payment terms
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-750 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-semibold tracking-wide uppercase">
            <span>Draft Estimates</span>
            <FileText size={16} className="text-neutral-400" />
          </div>
          <p className="text-white text-2xl font-bold tracking-tight mt-3">
            ₹{draftRevenue.toLocaleString("en-IN")}
          </p>
          <span className="text-[10px] text-neutral-400 font-semibold bg-neutral-850 border border-neutral-750 px-2 py-0.2 rounded-md mt-2 inline-block">
            Not sent yet
          </span>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-white text-xs font-bold tracking-wider uppercase mb-4">
            Paid Revenue Trends (Chronological)
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "#262626", borderRadius: "8px" }}
                  labelStyle={{ color: "#a3a3a3", fontSize: "11px" }}
                  itemStyle={{ color: "#ffffff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and Table Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-neutral-500" size={14} />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
            />
          </div>

          <div className="flex items-center gap-2 bg-neutral-950 p-1 rounded-lg border border-neutral-800/80 w-full md:w-auto overflow-x-auto">
            {["all", "draft", "sent", "paid", "overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xxs font-semibold rounded-md capitalize transition-all whitespace-nowrap ${
                  statusFilter === status ? "bg-indigo-600 text-white-literal" : "text-neutral-500 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-850 text-neutral-500 bg-neutral-950/20 font-medium">
                <th className="pb-3 px-2">Invoice #</th>
                <th className="pb-3 px-2">Client</th>
                <th className="pb-3 px-2">Base Amt</th>
                <th className="pb-3 px-2">GST</th>
                <th className="pb-3 px-2">Total Amount</th>
                <th className="pb-3 px-2">Issue Date</th>
                <th className="pb-3 px-2">Due Date</th>
                <th className="pb-3 px-2">Status</th>
                {canEdit("finance") && <th className="pb-3 px-2 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850/40">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-500 italic">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-850/15 transition-colors">
                    <td className="py-3.5 px-2 font-semibold text-white">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-2 text-neutral-400 font-medium">
                      {inv.clients?.name || "Unknown Client"}
                    </td>
                    <td className="py-3.5 px-2 text-neutral-300 font-medium">
                      ₹{inv.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-2 text-neutral-400 font-medium">
                      ₹{inv.gst_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-2 text-white font-bold">
                      ₹{inv.total_amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-2 text-neutral-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-neutral-500" />
                        {inv.issue_date}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-neutral-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-neutral-500" />
                        {inv.due_date || "Not Set"}
                      </div>
                    </td>
                    <td className="py-3.5 px-2">
                      {canEdit("finance") ? (
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as any)}
                          className={`text-xxs px-2 py-0.5 rounded border font-semibold bg-neutral-950 focus:outline-none focus:border-neutral-700 capitalize ${statusColors[inv.status]}`}
                        >
                          <option value="draft">Draft</option>
                          <option value="sent">Sent</option>
                          <option value="paid">Paid</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      ) : (
                        <span
                          className={`text-xxs px-2 py-0.5 rounded border capitalize font-semibold ${statusColors[inv.status]}`}
                        >
                          {inv.status}
                        </span>
                      )}
                    </td>
                    {canEdit("finance") && (
                      <td className="py-3.5 px-2 text-right">
                        <button
                          onClick={() => window.print()}
                          className="text-neutral-500 hover:text-indigo-400 text-xxs font-semibold transition-colors"
                        >
                          Print
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clients={clients}
      />
    </div>
  );
}

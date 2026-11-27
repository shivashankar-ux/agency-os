"use client";

import { useState } from "react";
import { BarChart3, FileBarChart } from "lucide-react";
import ReportsPageClient from "./ReportsPageClient";
import ClientReportsClient from "./ClientReportsClient";

export default function ReportsTabsClient({ internalProps, clients, profile }: any) {
  const [tab, setTab] = useState<"internal" | "client">("internal");

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("internal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "internal" ? "bg-indigo-650 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
          }`}
        >
          <BarChart3 size={15} /> Internal Analytics
        </button>
        <button
          onClick={() => setTab("client")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "client" ? "bg-indigo-650 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
          }`}
        >
          <FileBarChart size={15} /> Client Reports
        </button>
      </div>

      {tab === "internal" ? <ReportsPageClient {...internalProps} /> : <ClientReportsClient clients={clients} profile={profile} />}
    </div>
  );
}

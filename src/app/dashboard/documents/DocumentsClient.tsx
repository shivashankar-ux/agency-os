"use client";

import { useState } from "react";
import { FileText, FileSignature } from "lucide-react";
import WelcomeGuideEditor from "./WelcomeGuideEditor";
import AgreementGenerator from "./AgreementGenerator";

interface DocumentsClientProps {
  clients: any[];
  branding?: any;
}

export default function DocumentsClient({ clients, branding }: DocumentsClientProps) {
  const [tab, setTab] = useState<"welcome" | "agreement">("welcome");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 no-print">
        <button
          onClick={() => setTab("welcome")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "welcome" ? "bg-indigo-650 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
          }`}
        >
          <FileText size={15} />
          Welcome Guide
        </button>
        <button
          onClick={() => setTab("agreement")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "agreement" ? "bg-indigo-650 text-white" : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
          }`}
        >
          <FileSignature size={15} />
          Content Services Agreement
        </button>
      </div>

      {tab === "welcome" ? (
        <WelcomeGuideEditor clients={clients} branding={branding} />
      ) : (
        <AgreementGenerator clients={clients} />
      )}
    </div>
  );
}

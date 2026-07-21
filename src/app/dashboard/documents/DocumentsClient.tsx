"use client";

import { useState } from "react";
import { 
  FileText, Download, Sparkles, Building2, User, DollarSign, Calendar, AlertCircle, Loader2, CheckCircle2
} from "lucide-react";

interface DocumentsClientProps {
  clients: any[];
}

export default function DocumentsClient({ clients }: DocumentsClientProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || "");
  const [docType, setDocType] = useState<string>("welcome");
  
  // Field data states
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [serviceDescription, setServiceDescription] = useState("Monthly Retainer Agency Services");
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const handleGenerateAndDownload = async () => {
    if (!selectedClientId) {
      setErrorMsg("Please select a client first.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setGenerating(true);

    try {
      const fieldData = {
        date: new Date().toLocaleDateString("en-IN"),
        welcome_message: welcomeMessage,
        scope_summary: scopeSummary,
        service_description: serviceDescription,
        total_amount: totalAmount || selectedClient?.monthly_retainer_value || 0,
      };

      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId,
          type: docType,
          fieldData,
        }),
      });

      const data = await res.json();
      setGenerating(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to generate PDF document.");
        return;
      }

      // Convert Base64 string to Blob and trigger browser download
      const binaryStr = atob(data.base64Pdf);
      const len = binaryStr.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = data.filename || `document_${docType}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg(`PDF Generated & Downloaded: ${data.filename}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setGenerating(false);
      setErrorMsg(err.message || "An unexpected error occurred during PDF generation.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-indigo-400" size={22} />
          Client Document Generator
        </h1>
        <p className="text-neutral-500 text-xs mt-1">
          Generate branded PDFs (Welcome Kits, Onboarding Guides, Advance & Final Invoices) with ₹ support.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-900 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Controls Column */}
        <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
            1. Document Setup & Fields
          </h2>

          {/* Client Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="text-neutral-400 font-semibold block">Select Target Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-medium focus:outline-none focus:border-indigo-500"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.contact_person || c.email || "Client"})
                </option>
              ))}
            </select>
          </div>

          {/* Document Type Selector */}
          <div className="space-y-1.5 text-xs">
            <label className="text-neutral-400 font-semibold block">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="welcome">🎉 Client Welcome Document (PDF)</option>
              <option value="onboarding">🚀 Client Onboarding Guide (PDF)</option>
              <option value="advance_invoice">💳 Advance Invoice (PDF)</option>
              <option value="final_invoice">🧾 Final Tax Invoice (PDF)</option>
            </select>
          </div>

          {/* Dynamic Field Inputs based on Doc Type */}
          {docType === "welcome" || docType === "onboarding" ? (
            <>
              <div className="space-y-1.5 text-xs">
                <label className="text-neutral-400 font-semibold block">Custom Welcome Message</label>
                <textarea
                  rows={3}
                  placeholder="We are thrilled to work with your team..."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-neutral-400 font-semibold block">Scope & Commitment Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detailed breakdown of deliverables, milestones, and timelines..."
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5 text-xs">
                <label className="text-neutral-400 font-semibold block">Service / Item Description</label>
                <input
                  type="text"
                  placeholder="Monthly Retainer Services - Social Media & Web Dev"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-neutral-400 font-semibold block">Total Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  value={totalAmount || selectedClient?.monthly_retainer_value || 0}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}

          <button
            onClick={handleGenerateAndDownload}
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Rendering Branded PDF...
              </>
            ) : (
              <>
                <Download size={16} /> Generate & Download PDF
              </>
            )}
          </button>
        </div>

        {/* Real-time Summary & Overview Card */}
        <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> 2. Live Document Overview
            </h2>

            {selectedClient && (
              <div className="space-y-3 text-xs bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-neutral-400">Client:</span>
                  <span className="text-white font-bold">{selectedClient.name}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-neutral-400">Contact Email:</span>
                  <span className="text-indigo-400">{selectedClient.email || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-850 pb-2">
                  <span className="text-neutral-400">Contract Type:</span>
                  <span className="text-white capitalize">{selectedClient.contract_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Retainer Value:</span>
                  <span className="text-emerald-400 font-bold">₹{Number(selectedClient.monthly_retainer_value || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xxs text-neutral-300 leading-relaxed space-y-2">
              <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Building2 size={13} /> Auto-Injected Branding Defaults
              </p>
              <p>
                Your agency logo, GSTIN, billing address, and bank account details will automatically embed into this document based on your <strong>Agency Branding Settings</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

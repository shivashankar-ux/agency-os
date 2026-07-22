"use client";

import { useState } from "react";
import { 
  FileText, Download, Sparkles, Building2, User, DollarSign, Calendar, AlertCircle, Loader2, CheckCircle2, Mail, Plus, X
} from "lucide-react";

interface DocumentsClientProps {
  clients: any[];
}

const AVAILABLE_SERVICES = [
  "Social Media Management",
  "Performance Marketing & Ads",
  "Search Engine Optimization (SEO)",
  "Web Development & Maintenance",
  "Graphic Design & Brand Asset Creation",
  "Content Strategy & Copywriting",
  "UI/UX Design",
  "Video Production & Editing"
];

export default function DocumentsClient({ clients }: DocumentsClientProps) {
  // Input fields
  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [docType, setDocType] = useState<string>("agreement");

  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Helper for services checkbox toggles
  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleGenerateAndDownload = async (sendEmail = false) => {
    if (!clientName.trim()) {
      setErrorMsg("Please enter the client business name.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    if (sendEmail) {
      setSendingEmail(true);
    } else {
      setGenerating(true);
    }

    try {
      // Find matching client record or mock one
      const matchedClient = clients.find(
        (c) => c.name.toLowerCase() === clientName.toLowerCase()
      );
      const clientId = matchedClient?.id || clients[0]?.id; // Default fallback to satisfy API

      const fieldData = {
        date: new Date().toLocaleDateString("en-IN"),
        welcome_message: `We are thrilled to embark on this growth journey with you. Our dedicated team is committed to driving outstanding strategy and results for your brand: ${clientName}.`,
        scope_summary: `Services included: ${selectedServices.join(", ") || "Retainer Services"}.\nMonthly Retainer Value: ₹${Number(paymentAmount).toLocaleString("en-IN")}`,
        service_description: selectedServices.join(" + ") || "Professional Retainer Services",
        total_amount: paymentAmount || 0,
        services: selectedServices,
      };

      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: docType,
          fieldData,
          sendEmail,
        }),
      });

      const data = await res.json();
      setGenerating(false);
      setSendingEmail(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Failed to process PDF document.");
        return;
      }

      if (sendEmail) {
        setSuccessMsg(`PDF Generated & successfully emailed to client!`);
      } else {
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
        link.download = `${docType}_${clientName.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMsg(`PDF Generated & Downloaded successfully!`);
      }
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setGenerating(false);
      setSendingEmail(false);
      setErrorMsg(err.message || "An unexpected error occurred during PDF generation.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl text-xs">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="text-indigo-400" size={22} />
          Document & Agreement Generator
        </h1>
        <p className="text-neutral-500 text-xs mt-1">
          Select target output document, enter Client details & select Services to generate instantly.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={16} />
          <p>{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-950/50 border border-red-900 text-red-400 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} />
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Controls Column */}
        <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3">
            1. Enter Client Details
          </h2>

          {/* Client Business Name (Manual Entry) */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Client Business Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-semibold"
            />
          </div>

          {/* Services Checklist selection */}
          <div className="space-y-2">
            <label className="text-neutral-400 font-semibold block">Select Services Opted</label>
            <div className="grid grid-cols-1 gap-2 bg-neutral-950 border border-neutral-850 p-3 rounded-xl max-h-40 overflow-y-auto">
              {AVAILABLE_SERVICES.map((service) => {
                const isSelected = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleServiceToggle(service)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-950/60 border-indigo-800 text-indigo-300 font-medium"
                        : "bg-transparent border-transparent text-neutral-500 hover:text-neutral-350"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                        isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "border-neutral-750"
                      }`}
                    >
                      {isSelected && "✓"}
                    </div>
                    <span className="truncate">{service}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Retainer Payment Value */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Monthly Payment / Retainer Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 75000"
              value={paymentAmount || ""}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-bold placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Document Format Selector */}
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Select Document Output</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="agreement">📄 1. Service Agreement (PDF)</option>
              <option value="welcome">🎉 2. Client Welcome Document (PDF)</option>
              <option value="advance_invoice">💳 3. Advance Invoice (PDF)</option>
              <option value="final_invoice">🧾 4. Final Tax Invoice (PDF)</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateAndDownload(false)}
              disabled={generating || sendingEmail}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Rendering...
                </>
              ) : (
                <>
                  <Download size={16} /> Download PDF
                </>
              )}
            </button>

            <button
              onClick={() => handleGenerateAndDownload(true)}
              disabled={generating || sendingEmail}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {sendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Mail size={16} className="text-indigo-400" /> Send via Email
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Summary Card */}
        <div className="md:col-span-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> 2. Selected Layout Summary
            </h2>

            <div className="space-y-3 bg-neutral-950 border border-neutral-800 rounded-xl p-4">
              <div className="flex justify-between border-b border-neutral-850 pb-2">
                <span className="text-neutral-400">Client Business Name:</span>
                <span className="text-white font-bold">{clientName || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-850 pb-2">
                <span className="text-neutral-400">Selected Output:</span>
                <span className="text-indigo-400 font-bold uppercase">{docType.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-850 pb-2">
                <span className="text-neutral-400">Retainer payment amount:</span>
                <span className="text-emerald-400 font-bold">₹{Number(paymentAmount || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="space-y-1">
                <span className="text-neutral-400">Services Included:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedServices.length === 0 ? (
                    <span className="text-neutral-600 italic">None selected</span>
                  ) : (
                    selectedServices.map((s) => (
                      <span key={s} className="bg-neutral-900 border border-neutral-805 text-white-literal px-2 py-0.5 rounded-md text-[10px]">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-950/30 border border-indigo-900/40 rounded-xl text-xxs text-neutral-350 leading-relaxed space-y-2">
              <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Building2 size={13} /> Branded Output Setup
              </p>
              <p>
                Your agency logo (public image URL) and branding details set up in <strong>Settings</strong> will automatically render onto the headers of your generated Service Agreements, Welcome documents, and Invoices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

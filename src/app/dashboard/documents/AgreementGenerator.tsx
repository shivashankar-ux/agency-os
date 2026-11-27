"use client";

import { useState } from "react";
import { FileSignature, Download, Mail, Loader2 } from "lucide-react";

const PLAN_FEES: Record<string, number | null> = {
  monthly: 20000,
  quarterly: 50000,
  half_yearly: 90000,
  annual: null,
};

const PLAN_LABELS: Record<string, string> = {
  monthly: "Monthly (4 reels/month)",
  quarterly: "Quarterly (12 reels total)",
  half_yearly: "Half-yearly (24 reels total)",
  annual: "Annual (48 reels total)",
};

interface AgreementGeneratorProps {
  clients: any[];
}

export default function AgreementGenerator({ clients }: AgreementGeneratorProps) {
  const [clientId, setClientId] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [plan, setPlan] = useState("monthly");
  const [fee, setFee] = useState<number | "">(PLAN_FEES.monthly || "");
  const [paymentSchedule, setPaymentSchedule] = useState("Before the first shoot of each period");
  const [reschedulingFee, setReschedulingFee] = useState<number | "">("");
  const [revisionFee, setRevisionFee] = useState<number | "">("");
  const [sendEmail, setSendEmail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleClientChange(id: string) {
    setClientId(id);
    const c = clients.find((cl) => cl.id === id);
    if (c) {
      setOwnerName((prev) => prev || c.contact_person || "");
      setOwnerPhone((prev) => prev || c.phone || "");
    }
  }

  function handlePlanChange(nextPlan: string) {
    setPlan(nextPlan);
    const defaultFee = PLAN_FEES[nextPlan];
    if (defaultFee) setFee(defaultFee);
  }

  async function handleGenerate() {
    setError(null);
    setSuccess(null);
    if (!clientId) {
      setError("Select a client first.");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type: "content_services_agreement",
          sendEmail,
          fieldData: {
            client_address: clientAddress,
            owner_name: ownerName,
            owner_phone: ownerPhone,
            plan_start_date: planStartDate,
            plan,
            fee: Number(fee) || 0,
            payment_schedule: paymentSchedule,
            rescheduling_fee: Number(reschedulingFee) || 0,
            revision_fee: Number(revisionFee) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate agreement.");
      }

      const byteChars = atob(data.base64Pdf);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename || "agreement.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccess(sendEmail ? "Agreement generated, downloaded, and emailed to the client." : "Agreement generated and downloaded.");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  const inputClass =
    "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500";
  const labelClass = "block text-xs font-semibold text-neutral-400 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-white">
        <FileSignature className="text-amber-500" size={20} />
        <h2 className="font-bold text-lg">Content Services Agreement</h2>
      </div>
      <p className="text-neutral-500 text-sm">
        Generates the standard gym content agreement (plan, fees, script approval and revision terms) for the
        selected client.
      </p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className={labelClass}>Client</label>
          <select className={inputClass} value={clientId} onChange={(e) => handleClientChange(e.target.value)}>
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Gym address</label>
            <input className={inputClass} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Owner / authorised person</label>
            <input className={inputClass} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Owner phone / WhatsApp</label>
            <input className={inputClass} value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Plan start date</label>
            <input type="date" className={inputClass} value={planStartDate} onChange={(e) => setPlanStartDate(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Plan</label>
            <select className={inputClass} value={plan} onChange={(e) => handlePlanChange(e.target.value)}>
              {Object.keys(PLAN_LABELS).map((key) => (
                <option key={key} value={key}>{PLAN_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Fee (₹)</label>
            <input
              type="number"
              className={inputClass}
              value={fee}
              onChange={(e) => setFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Payment schedule agreed</label>
          <input className={inputClass} value={paymentSchedule} onChange={(e) => setPaymentSchedule(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Rescheduling fee (₹)</label>
            <input
              type="number"
              className={inputClass}
              value={reschedulingFee}
              onChange={(e) => setReschedulingFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div>
            <label className={labelClass}>Extra revision round fee (₹)</label>
            <input
              type="number"
              className={inputClass}
              value={revisionFee}
              onChange={(e) => setRevisionFee(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-400">
          <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
          Also email the PDF to the client
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer text-sm"
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : sendEmail ? <Mail size={16} /> : <Download size={16} />}
          {generating ? "Generating…" : "Generate & Download Agreement"}
        </button>
      </div>
    </div>
  );
}

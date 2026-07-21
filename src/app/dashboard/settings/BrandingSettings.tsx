"use client";

import { useState } from "react";
import { updateOrgBranding } from "@/app/actions/branding";
import { Building2, Palette, Landmark, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface BrandingSettingsProps {
  initialBranding: any;
  isOwnerOrAdmin: boolean;
}

export default function BrandingSettings({
  initialBranding,
  isOwnerOrAdmin,
}: BrandingSettingsProps) {
  const [branding, setBranding] = useState({
    company_name: initialBranding?.company_name || "",
    company_address: initialBranding?.company_address || "",
    gstin: initialBranding?.gstin || "",
    primary_color: initialBranding?.primary_color || "#4f46e5",
    accent_color: initialBranding?.accent_color || "#06b6d4",
    logo_url: initialBranding?.logo_url || "",
    bank_name: initialBranding?.bank_details?.bank_name || "",
    account_number: initialBranding?.bank_details?.account_number || "",
    ifsc_code: initialBranding?.bank_details?.ifsc_code || "",
    account_name: initialBranding?.bank_details?.account_name || "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setSubmitting(true);

    const formData = new FormData();
    Object.entries(branding).forEach(([key, val]) => {
      formData.append(key, String(val));
    });

    const res = await updateOrgBranding(formData);
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Agency branding defaults saved successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-xs max-w-4xl">
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

      {/* 1. Agency Identity & Contact */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-850 pb-3">
          <Building2 size={16} className="text-indigo-400" />
          Agency Identity & Billing Address
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Company Name</label>
            <input
              type="text"
              placeholder="e.g. The Story Builder Digital Agency"
              value={branding.company_name}
              onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">GSTIN / Tax Registration Number</label>
            <input
              type="text"
              placeholder="e.g. 36AAAAA0000A1Z5"
              value={branding.gstin}
              onChange={(e) => setBranding({ ...branding, gstin: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-neutral-400 font-semibold block">Full Billing Address</label>
          <textarea
            rows={2}
            placeholder="Plot No 42, Jubilee Hills, Hyderabad, Telangana 500033"
            value={branding.company_address}
            onChange={(e) => setBranding({ ...branding, company_address: e.target.value })}
            disabled={!isOwnerOrAdmin}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* 2. Visual Branding & Styling */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-850 pb-3">
          <Palette size={16} className="text-indigo-400" />
          PDF Document Styling & Colors
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Primary Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                disabled={!isOwnerOrAdmin}
                className="w-9 h-9 bg-transparent border-0 rounded-lg cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={branding.primary_color}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                disabled={!isOwnerOrAdmin}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={branding.accent_color}
                onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                disabled={!isOwnerOrAdmin}
                className="w-9 h-9 bg-transparent border-0 rounded-lg cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={branding.accent_color}
                onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                disabled={!isOwnerOrAdmin}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Logo URL (Public Image Link)</label>
            <input
              type="url"
              placeholder="https://..."
              value={branding.logo_url}
              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* 3. Bank Account & Payment Details */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-neutral-850 pb-3">
          <Landmark size={16} className="text-indigo-400" />
          Bank Details (Auto-injected into Invoices)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Account Beneficiary Name</label>
            <input
              type="text"
              placeholder="e.g. Shiva Shankar"
              value={branding.account_name}
              onChange={(e) => setBranding({ ...branding, account_name: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Bank Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank Ltd"
              value={branding.bank_name}
              onChange={(e) => setBranding({ ...branding, bank_name: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Account Number</label>
            <input
              type="text"
              placeholder="e.g. 50100234567890"
              value={branding.account_number}
              onChange={(e) => setBranding({ ...branding, account_number: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">IFSC Code</label>
            <input
              type="text"
              placeholder="e.g. HDFC0001234"
              value={branding.ifsc_code}
              onChange={(e) => setBranding({ ...branding, ifsc_code: e.target.value })}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {isOwnerOrAdmin && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-900/20 text-xs"
          >
            {submitting ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving...
              </>
            ) : (
              "Save Agency Branding Defaults"
            )}
          </button>
        </div>
      )}
    </form>
  );
}

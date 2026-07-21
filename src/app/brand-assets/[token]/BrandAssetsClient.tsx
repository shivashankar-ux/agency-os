"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { submitBrandAssets } from "@/app/actions/brand-assets";
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Palette, Type, Image as ImageIcon, Send } from "lucide-react";

interface BrandAssetsClientProps {
  token: string;
  clientName: string;
  agencyName: string;
}

export default function BrandAssetsClient({
  token,
  clientName,
  agencyName,
}: BrandAssetsClientProps) {
  const [formData, setFormData] = useState({
    primary_color: "#4f46e5",
    accent_color: "#06b6d4",
    primary_font: "",
    tagline: "",
    brand_voice: "",
    website_url: "",
    logo_link: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await submitBrandAssets(token, formData);
    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 text-center shadow-2xl space-y-4"
        >
          <div className="w-16 h-16 bg-emerald-950 border border-emerald-800 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Brand Assets Received!</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Thank you, <strong className="text-white">{clientName}</strong>! Your brand assets, colors, and notes have been securely received by <strong className="text-white">{agencyName}</strong>.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start p-4 sm:p-6">
      <header className="w-full max-w-2xl py-6 border-b border-neutral-900 mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-600/30">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Brand Assets Collection Form</h1>
          <p className="text-neutral-500 text-xs">For <strong className="text-indigo-400">{clientName}</strong> | Requested by <strong className="text-white">{agencyName}</strong></p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {error && (
          <div className="p-3.5 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={16} />
            <p>{error}</p>
          </div>
        )}

        {/* Brand Colors */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Palette size={15} className="text-indigo-400" /> Primary Brand Colors
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-neutral-400 text-xs block">Primary Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-9 h-9 bg-transparent border-0 rounded-lg cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-neutral-400 text-xs block">Accent Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-9 h-9 bg-transparent border-0 rounded-lg cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={formData.accent_color}
                  onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Typography & Tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Type size={15} className="text-indigo-400" /> Primary Font Name
            </label>
            <input
              type="text"
              placeholder="e.g. Montserrat, Inter, Helvetica"
              value={formData.primary_font}
              onChange={(e) => setFormData({ ...formData, primary_font: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Website URL
            </label>
            <input
              type="url"
              placeholder="https://yourbrand.com"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Logo Link & Brand Drive */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon size={15} className="text-indigo-400" /> High-Res Logo / Brand Drive Link
          </label>
          <input
            type="url"
            placeholder="Paste your Google Drive, Figma, or Dropbox link containing vector logos & brand guide"
            value={formData.logo_link}
            onChange={(e) => setFormData({ ...formData, logo_link: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Tagline & Voice */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Brand Tagline & Tone of Voice Notes
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Tagline: 'Building the Future'. Tone: Bold, Professional, Modern."
            value={formData.brand_voice}
            onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white placeholder-neutral-600 text-xs focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Submitting Assets...
            </>
          ) : (
            <>
              <Send size={15} /> Submit Brand Assets to Agency
            </>
          )}
        </button>
      </form>
    </div>
  );
}

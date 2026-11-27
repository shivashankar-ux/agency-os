"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, Loader2, CheckCircle2 } from "lucide-react";
import { FORM_SECTIONS } from "./formSections";

interface OnboardingClientProps {
  client: { id: string; name: string };
  initialResponses: Record<string, any>;
  submittedAt: string | null;
  profile: { id: string; org_id: string };
}

export default function OnboardingClient({ client, initialResponses, submittedAt, profile }: OnboardingClientProps) {
  const supabase = createClient();
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(submittedAt);

  function setValue(key: string, value: any) {
    setResponses((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCheckbox(key: string, option: string) {
    const current: string[] = Array.isArray(responses[key]) ? responses[key] : [];
    const next = current.includes(option) ? current.filter((o) => o !== option) : [...current, option];
    setValue(key, next);
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("client_onboarding")
      .upsert(
        {
          org_id: profile.org_id,
          client_id: client.id,
          responses,
          submitted_at: now,
          created_by: profile.id,
          updated_at: now,
        },
        { onConflict: "client_id" }
      );
    setSaving(false);
    if (!error) setSaved(now);
  }

  const inputClass =
    "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm w-fit">
        <ArrowLeft size={16} /> Back to {client.name}
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white">Gym Client Onboarding Form</h1>
        <p className="text-neutral-500 text-sm mt-1">
          {client.name} — helps us plan content around your brand, your offers and your members.
        </p>
        {saved && (
          <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Last saved {new Date(saved).toLocaleString("en-IN")}
          </p>
        )}
      </div>

      {FORM_SECTIONS.map((section) => (
        <div key={section.title} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-wide text-amber-500">{section.title}</h2>
          {section.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-neutral-400 mb-1.5">{field.label}</label>
              {field.type === "text" && (
                <input className={inputClass} value={responses[field.key] || ""} onChange={(e) => setValue(field.key, e.target.value)} />
              )}
              {field.type === "textarea" && (
                <textarea className={`${inputClass} min-h-[70px]`} value={responses[field.key] || ""} onChange={(e) => setValue(field.key, e.target.value)} />
              )}
              {field.type === "checkbox" && (
                <div className="flex flex-wrap gap-3">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm text-neutral-300">
                      <input
                        type="checkbox"
                        checked={Array.isArray(responses[field.key]) && responses[field.key].includes(opt)}
                        onChange={() => toggleCheckbox(field.key, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {field.type === "radio" && (
                <div className="flex flex-wrap gap-3">
                  {field.options?.map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-sm text-neutral-300">
                      <input
                        type="radio"
                        name={field.key}
                        checked={responses[field.key] === opt}
                        onChange={() => setValue(field.key, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-sm"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? "Saving…" : "Save Onboarding Form"}
      </button>
    </div>
  );
}

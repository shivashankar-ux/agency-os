"use client";

import { useState } from "react";
import { updateDocumentTemplate } from "@/app/actions/document-templates";
import { FileText, Save, CheckCircle2, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";

interface TemplateEditorProps {
  templates: any[];
  isOwnerOrAdmin: boolean;
}

export default function TemplateEditor({ templates: initialTemplates, isOwnerOrAdmin }: TemplateEditorProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeTemplate = templates[selectedIdx];

  const handleSaveTemplate = async () => {
    if (!activeTemplate) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    const res = await updateDocumentTemplate(
      activeTemplate.id,
      activeTemplate.name,
      activeTemplate.content
    );
    setSubmitting(false);

    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setSuccessMsg("Document template updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleSectionTextChange = (sectionId: string, field: "heading" | "body", value: string) => {
    const updatedContent = { ...activeTemplate.content };
    updatedContent.sections = updatedContent.sections.map((sec: any) =>
      sec.id === sectionId ? { ...sec, [field]: value } : sec
    );

    setTemplates((prev) =>
      prev.map((t, idx) => (idx === selectedIdx ? { ...t, content: updatedContent } : t))
    );
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-xs text-neutral-500 italic">
        Loading document templates...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs max-w-5xl">
      {/* Templates List Sidebar */}
      <div className="md:col-span-4 space-y-2">
        <label className="text-neutral-400 font-bold uppercase tracking-wider block mb-1">Templates</label>
        {templates.map((tmpl, idx) => (
          <button
            key={tmpl.id}
            onClick={() => {
              setSelectedIdx(idx);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl border font-semibold transition-all flex items-center gap-2 ${
              idx === selectedIdx
                ? "bg-neutral-900 text-white border-neutral-800 shadow"
                : "text-neutral-500 border-transparent hover:bg-neutral-900/50 hover:text-white"
            }`}
          >
            <FileText size={14} className={idx === selectedIdx ? "text-indigo-400" : ""} />
            <span className="capitalize">{tmpl.type.replace("_", " ")}</span>
          </button>
        ))}
      </div>

      {/* Editor Panel */}
      <div className="md:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
          <div>
            <h3 className="text-white font-bold text-sm capitalize">
              Edit {activeTemplate.type.replace("_", " ")} Template
            </h3>
            <p className="text-neutral-500 text-xxs mt-0.5">
              Customize the default sections and descriptions loaded for this document.
            </p>
          </div>

          {isOwnerOrAdmin && (
            <button
              onClick={handleSaveTemplate}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-1.5 px-4 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Save Template
            </button>
          )}
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-900 text-emerald-400 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={15} />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 rounded-xl flex items-center gap-2">
            <AlertCircle size={15} />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Template Settings Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-neutral-400 font-semibold block">Template Name</label>
            <input
              type="text"
              value={activeTemplate.name}
              onChange={(e) =>
                setTemplates((prev) =>
                  prev.map((t, idx) => (idx === selectedIdx ? { ...t, name: e.target.value } : t))
                )
              }
              disabled={!isOwnerOrAdmin}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sections List */}
          <div className="space-y-4 pt-2">
            <label className="text-neutral-300 font-bold block">Default Document Sections</label>
            {activeTemplate.content?.sections?.map((sec: any) => (
              <div key={sec.id} className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 space-y-3">
                <div className="space-y-1.5">
                  <span className="text-neutral-400 text-xxs block">Section Heading</span>
                  <input
                    type="text"
                    value={sec.heading}
                    onChange={(e) => handleSectionTextChange(sec.id, "heading", e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-neutral-400 text-xxs block">Section Copy / Body Text</span>
                  <textarea
                    rows={3}
                    value={sec.body}
                    onChange={(e) => handleSectionTextChange(sec.id, "body", e.target.value)}
                    disabled={!isOwnerOrAdmin}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

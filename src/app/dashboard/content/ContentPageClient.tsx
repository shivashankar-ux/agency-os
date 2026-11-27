"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, X, Film, CheckCircle2, Circle, Loader2, Send, ThumbsUp, MessageSquareWarning,
  Clapperboard, Scissors, UploadCloud,
} from "lucide-react";
import { SHOOT_DAY_ITEMS, EDITOR_ITEMS } from "./checklistItems";

const STATUS_LABELS: Record<string, string> = {
  script_sent: "Script Sent",
  changes_requested: "Changes Requested",
  approved: "Approved",
  shot: "Shot",
  edited: "Edited",
  posted: "Posted",
};

const STATUS_COLORS: Record<string, string> = {
  script_sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  changes_requested: "bg-red-500/15 text-red-400 border-red-500/30",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  shot: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  edited: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  posted: "bg-neutral-500/15 text-neutral-300 border-neutral-500/30",
};

interface Reel {
  id: string;
  org_id: string;
  client_id: string;
  title: string;
  script_text: string | null;
  caption: string | null;
  hashtags: string[] | null;
  scheduled_shoot_date: string | null;
  status: string;
  revision_count: number;
  revision_notes: string | null;
  posted_at: string | null;
  views: number | null;
  likes: number | null;
  saves: number | null;
  comments: number | null;
  clients?: { name: string } | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  sort_order: number;
  is_checked: boolean;
}

interface Checklist {
  id: string;
  checklist_type: "shoot_day" | "editor";
  items: ChecklistItem[];
}

interface ContentPageClientProps {
  initialReels: Reel[];
  clients: { id: string; name: string }[];
  profile: { id: string; org_id: string };
}

export default function ContentPageClient({ initialReels, clients, profile }: ContentPageClientProps) {
  const supabase = createClient();
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [newScript, setNewScript] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [newHashtags, setNewHashtags] = useState("");
  const [newDate, setNewDate] = useState("");

  const filteredReels = reels.filter(
    (r) => (!clientFilter || r.client_id === clientFilter) && (!statusFilter || r.status === statusFilter)
  );

  async function createReel() {
    if (!newTitle.trim() || !newClientId) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("reels")
      .insert({
        org_id: profile.org_id,
        client_id: newClientId,
        title: newTitle.trim(),
        script_text: newScript || null,
        caption: newCaption || null,
        hashtags: newHashtags ? newHashtags.split(",").map((h) => h.trim()).filter(Boolean) : [],
        scheduled_shoot_date: newDate || null,
        created_by: profile.id,
      })
      .select("*, clients(name)")
      .single();
    setCreating(false);
    if (!error && data) {
      setReels((prev) => [data as Reel, ...prev]);
      setShowNewModal(false);
      setNewTitle(""); setNewClientId(""); setNewScript(""); setNewCaption(""); setNewHashtags(""); setNewDate("");
    }
  }

  async function openReel(reel: Reel) {
    setSelectedReel(reel);
    setScriptDraft(reel.script_text || "");
    setLoadingChecklists(true);
    const { data } = await supabase
      .from("production_checklists")
      .select("id, checklist_type, production_checklist_items(id, label, sort_order, is_checked)")
      .eq("reel_id", reel.id);
    const mapped: Checklist[] = (data || []).map((c: any) => ({
      id: c.id,
      checklist_type: c.checklist_type,
      items: (c.production_checklist_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setChecklists(mapped);
    setLoadingChecklists(false);
  }

  function updateReelInList(updated: Reel) {
    setReels((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setSelectedReel((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  }

  async function saveScript() {
    if (!selectedReel) return;
    setBusy(true);
    const { data } = await supabase
      .from("reels")
      .update({ script_text: scriptDraft, updated_at: new Date().toISOString() })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function markApproved() {
    if (!selectedReel) return;
    setBusy(true);
    const { data } = await supabase
      .from("reels")
      .update({ status: "approved", approved_by: profile.id, approved_at: new Date().toISOString() })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function requestChanges() {
    if (!selectedReel) return;
    const notes = window.prompt("What needs to change?");
    if (notes === null) return;
    setBusy(true);
    const { data } = await supabase
      .from("reels")
      .update({
        status: "changes_requested",
        revision_notes: notes,
        revision_count: (selectedReel.revision_count || 0) + 1,
      })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function resendScript() {
    if (!selectedReel) return;
    setBusy(true);
    const { data } = await supabase
      .from("reels")
      .update({ status: "script_sent", script_text: scriptDraft })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function ensureChecklist(type: "shoot_day" | "editor") {
    if (!selectedReel) return;
    const existing = checklists.find((c) => c.checklist_type === type);
    if (existing) return existing;

    const { data: checklist } = await supabase
      .from("production_checklists")
      .insert({ reel_id: selectedReel.id, checklist_type: type })
      .select("id, checklist_type")
      .single();

    if (!checklist) return null;

    const labels = type === "shoot_day" ? SHOOT_DAY_ITEMS : EDITOR_ITEMS;
    const rows = labels.map((label, i) => ({ checklist_id: checklist.id, label, sort_order: i }));
    const { data: items } = await supabase.from("production_checklist_items").insert(rows).select("*");

    const newChecklist: Checklist = {
      id: checklist.id,
      checklist_type: type,
      items: (items || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    };
    setChecklists((prev) => [...prev, newChecklist]);
    return newChecklist;
  }

  async function markShot() {
    if (!selectedReel) return;
    setBusy(true);
    await ensureChecklist("shoot_day");
    const { data } = await supabase
      .from("reels")
      .update({ status: "shot" })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function markEdited() {
    if (!selectedReel) return;
    setBusy(true);
    await ensureChecklist("editor");
    const { data } = await supabase
      .from("reels")
      .update({ status: "edited" })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function markPosted() {
    if (!selectedReel) return;
    const views = window.prompt("Views (optional)") || "";
    const likes = window.prompt("Likes (optional)") || "";
    const saves = window.prompt("Saves (optional)") || "";
    const comments = window.prompt("Comments (optional)") || "";
    setBusy(true);
    const { data } = await supabase
      .from("reels")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        views: views ? Number(views) : null,
        likes: likes ? Number(likes) : null,
        saves: saves ? Number(saves) : null,
        comments: comments ? Number(comments) : null,
      })
      .eq("id", selectedReel.id)
      .select("*, clients(name)")
      .single();
    setBusy(false);
    if (data) updateReelInList(data as Reel);
  }

  async function toggleItem(checklistId: string, item: ChecklistItem) {
    const nextChecked = !item.is_checked;
    setChecklists((prev) =>
      prev.map((c) =>
        c.id !== checklistId
          ? c
          : { ...c, items: c.items.map((it) => (it.id === item.id ? { ...it, is_checked: nextChecked } : it)) }
      )
    );
    await supabase
      .from("production_checklist_items")
      .update({
        is_checked: nextChecked,
        checked_by: nextChecked ? profile.id : null,
        checked_at: nextChecked ? new Date().toISOString() : null,
      })
      .eq("id", item.id);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white">
          <Clapperboard className="text-amber-500" size={20} />
          <h1 className="font-bold text-lg">Content</h1>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold px-4 py-2 rounded-lg text-sm"
        >
          <Plus size={16} /> New Reel
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
        >
          <option value="">All clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        {filteredReels.length === 0 && (
          <div className="text-neutral-500 text-sm bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center">
            No reels yet. Click "New Reel" to add one.
          </div>
        )}
        {filteredReels.map((r) => (
          <button
            key={r.id}
            onClick={() => openReel(r)}
            className="flex items-center justify-between bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 text-left transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Film size={16} className="text-neutral-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold truncate">{r.title}</div>
                <div className="text-neutral-500 text-xs truncate">
                  {r.clients?.name || "—"}
                  {r.scheduled_shoot_date ? ` · ${r.scheduled_shoot_date}` : ""}
                </div>
              </div>
            </div>
            <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[r.status]}`}>
              {STATUS_LABELS[r.status]}
            </span>
          </button>
        ))}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNewModal(false)}>
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 w-full max-w-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">New Reel</h2>
              <button onClick={() => setShowNewModal(false)}><X size={18} className="text-neutral-500" /></button>
            </div>
            <select
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              value={newClientId}
              onChange={(e) => setNewClientId(e.target.value)}
            >
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Reel title (e.g. Transformation Tuesday)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white min-h-[90px]"
              placeholder="Script"
              value={newScript}
              onChange={(e) => setNewScript(e.target.value)}
            />
            <textarea
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Caption"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
            />
            <input
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              placeholder="Hashtags, comma separated"
              value={newHashtags}
              onChange={(e) => setNewHashtags(e.target.value)}
            />
            <input
              type="date"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <button
              onClick={createReel}
              disabled={creating || !newTitle.trim() || !newClientId}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold px-4 py-2.5 rounded-lg text-sm"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {creating ? "Creating…" : "Create Reel (sends script)"}
            </button>
          </div>
        </div>
      )}

      {selectedReel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedReel(null)}>
          <div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-bold text-lg">{selectedReel.title}</h2>
                <div className="text-neutral-500 text-xs">{selectedReel.clients?.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[selectedReel.status]}`}>
                  {STATUS_LABELS[selectedReel.status]}
                </span>
                <button onClick={() => setSelectedReel(null)}><X size={18} className="text-neutral-500" /></button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 mb-1">Script</label>
              <textarea
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white min-h-[100px]"
                value={scriptDraft}
                onChange={(e) => setScriptDraft(e.target.value)}
              />
              <button onClick={saveScript} disabled={busy} className="mt-2 text-xs text-amber-500 hover:text-amber-400 font-semibold">
                Save script
              </button>
            </div>

            {selectedReel.revision_notes && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                <strong>Revision notes ({selectedReel.revision_count}):</strong> {selectedReel.revision_notes}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedReel.status === "script_sent" && (
                <>
                  <button onClick={markApproved} disabled={busy} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                    <ThumbsUp size={14} /> Mark Approved
                  </button>
                  <button onClick={requestChanges} disabled={busy} className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                    <MessageSquareWarning size={14} /> Request Changes
                  </button>
                </>
              )}
              {selectedReel.status === "changes_requested" && (
                <button onClick={resendScript} disabled={busy} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                  <Send size={14} /> Resend Revised Script
                </button>
              )}
              {selectedReel.status === "approved" && (
                <button onClick={markShot} disabled={busy} className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-neutral-950 text-sm font-semibold px-3 py-2 rounded-lg">
                  <Clapperboard size={14} /> Mark as Shot
                </button>
              )}
              {selectedReel.status === "shot" && (
                <button onClick={markEdited} disabled={busy} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                  <Scissors size={14} /> Mark as Edited
                </button>
              )}
              {selectedReel.status === "edited" && (
                <button onClick={markPosted} disabled={busy} className="flex items-center gap-1.5 bg-neutral-600 hover:bg-neutral-500 text-white text-sm font-semibold px-3 py-2 rounded-lg">
                  <UploadCloud size={14} /> Mark as Posted
                </button>
              )}
            </div>

            {selectedReel.status === "posted" && (
              <div className="grid grid-cols-4 gap-2 text-center">
                {["views", "likes", "saves", "comments"].map((key) => (
                  <div key={key} className="bg-neutral-800 rounded-lg py-2">
                    <div className="text-white font-bold">{(selectedReel as any)[key] ?? "—"}</div>
                    <div className="text-neutral-500 text-[10px] uppercase">{key}</div>
                  </div>
                ))}
              </div>
            )}

            {loadingChecklists ? (
              <div className="text-neutral-500 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading checklists…</div>
            ) : (
              checklists.map((c) => (
                <div key={c.id} className="bg-neutral-800/50 border border-neutral-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">
                    {c.checklist_type === "shoot_day" ? "Shoot-Day Checklist" : "Editor Checklist"}
                  </h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {c.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(c.id, item)}
                        className="flex items-start gap-2 text-left w-full group"
                      >
                        {item.is_checked ? (
                          <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <Circle size={15} className="text-neutral-600 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-xs ${item.is_checked ? "text-neutral-500 line-through" : "text-neutral-300"}`}>
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

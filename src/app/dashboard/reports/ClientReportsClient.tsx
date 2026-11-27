"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileBarChart, Save, Loader2, Film } from "lucide-react";

interface ClientReportsClientProps {
  clients: { id: string; name: string }[];
  profile: { id: string; org_id: string };
}

function firstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function lastOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export default function ClientReportsClient({ clients, profile }: ClientReportsClientProps) {
  const supabase = createClient();
  const [clientId, setClientId] = useState("");
  const [periodStart, setPeriodStart] = useState(firstOfMonth());
  const [periodEnd, setPeriodEnd] = useState(lastOfMonth());
  const [reels, setReels] = useState<any[]>([]);
  const [loadingReels, setLoadingReels] = useState(false);

  const [followersStart, setFollowersStart] = useState<number | "">("");
  const [followersEnd, setFollowersEnd] = useState<number | "">("");
  const [totalViews, setTotalViews] = useState<number | "">("");
  const [profileVisits, setProfileVisits] = useState<number | "">("");
  const [enquiries, setEnquiries] = useState<number | "">("");
  const [newMembers, setNewMembers] = useState<number | "">("");
  const [whatWorked, setWhatWorked] = useState("");
  const [whatToImprove, setWhatToImprove] = useState("");
  const [ideas, setIdeas] = useState(["", "", "", ""]);
  const [suggestion, setSuggestion] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleClientOrPeriodChange(nextClientId: string, start: string, end: string) {
    setClientId(nextClientId);
    setPeriodStart(start);
    setPeriodEnd(end);
    if (!nextClientId) {
      setReels([]);
      return;
    }
    setLoadingReels(true);
    const { data } = await supabase
      .from("reels")
      .select("id, title, posted_at, views, likes, saves, comments")
      .eq("client_id", nextClientId)
      .eq("status", "posted")
      .gte("posted_at", start)
      .lte("posted_at", end + "T23:59:59")
      .order("posted_at", { ascending: true });
    setReels(data || []);
    setLoadingReels(false);
  }

  const totals = reels.reduce(
    (acc, r) => ({
      views: acc.views + (r.views || 0),
      likes: acc.likes + (r.likes || 0),
      saves: acc.saves + (r.saves || 0),
      comments: acc.comments + (r.comments || 0),
    }),
    { views: 0, likes: 0, saves: 0, comments: 0 }
  );

  async function handleSave() {
    if (!clientId) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase.from("client_reports").insert({
      org_id: profile.org_id,
      client_id: clientId,
      period_start: periodStart,
      period_end: periodEnd,
      followers_start: followersStart || null,
      followers_end: followersEnd || null,
      total_views_reach: totalViews || null,
      profile_visits: profileVisits || null,
      enquiries_received: enquiries || null,
      new_members_mentioned: newMembers || null,
      what_worked: whatWorked || null,
      what_to_improve: whatToImprove || null,
      next_month_reel_ideas: ideas.filter(Boolean),
      suggestion: suggestion || null,
      generated_by: profile.id,
    });
    setSaving(false);
    if (!error) setSaved(true);
  }

  const inputClass =
    "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500";
  const labelClass = "block text-xs font-semibold text-neutral-400 mb-1";

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-white">
        <FileBarChart className="text-amber-500" size={20} />
        <h2 className="font-bold text-lg">Monthly Client Report</h2>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Client</label>
            <select className={inputClass} value={clientId} onChange={(e) => handleClientOrPeriodChange(e.target.value, periodStart, periodEnd)}>
              <option value="">Select client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Period start</label>
            <input type="date" className={inputClass} value={periodStart} onChange={(e) => handleClientOrPeriodChange(clientId, e.target.value, periodEnd)} />
          </div>
          <div>
            <label className={labelClass}>Period end</label>
            <input type="date" className={inputClass} value={periodEnd} onChange={(e) => handleClientOrPeriodChange(clientId, periodStart, e.target.value)} />
          </div>
        </div>

        {clientId && (
          <div>
            <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-1.5"><Film size={14} /> Reels posted this period</h3>
            {loadingReels ? (
              <Loader2 size={16} className="animate-spin text-neutral-500" />
            ) : reels.length === 0 ? (
              <p className="text-neutral-500 text-xs">No posted reels found in this period.</p>
            ) : (
              <div className="border border-neutral-800 rounded-lg overflow-hidden text-xs">
                <div className="grid grid-cols-5 bg-neutral-800 text-neutral-400 font-semibold px-3 py-2">
                  <span>Reel</span><span>Posted</span><span>Views</span><span>Likes</span><span>Saves</span>
                </div>
                {reels.map((r) => (
                  <div key={r.id} className="grid grid-cols-5 px-3 py-2 border-t border-neutral-800 text-neutral-300">
                    <span className="truncate">{r.title}</span>
                    <span>{r.posted_at ? new Date(r.posted_at).toLocaleDateString("en-IN") : "—"}</span>
                    <span>{r.views ?? "—"}</span>
                    <span>{r.likes ?? "—"}</span>
                    <span>{r.saves ?? "—"}</span>
                  </div>
                ))}
                <div className="grid grid-cols-5 px-3 py-2 border-t border-neutral-800 bg-neutral-800/50 font-semibold text-neutral-200">
                  <span>Total</span><span /><span>{totals.views}</span><span>{totals.likes}</span><span>{totals.saves}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <h3 className="text-white font-semibold text-sm">Account snapshot</h3>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelClass}>Followers at start</label><input type="number" className={inputClass} value={followersStart} onChange={(e) => setFollowersStart(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div><label className={labelClass}>Followers at end</label><input type="number" className={inputClass} value={followersEnd} onChange={(e) => setFollowersEnd(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div><label className={labelClass}>Total views / reach</label><input type="number" className={inputClass} value={totalViews} onChange={(e) => setTotalViews(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div><label className={labelClass}>Profile visits</label><input type="number" className={inputClass} value={profileVisits} onChange={(e) => setProfileVisits(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div><label className={labelClass}>Enquiries received</label><input type="number" className={inputClass} value={enquiries} onChange={(e) => setEnquiries(e.target.value === "" ? "" : Number(e.target.value))} /></div>
          <div><label className={labelClass}>New members mentioning reels</label><input type="number" className={inputClass} value={newMembers} onChange={(e) => setNewMembers(e.target.value === "" ? "" : Number(e.target.value))} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelClass}>What worked well</label><textarea className={`${inputClass} min-h-[70px]`} value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} /></div>
          <div><label className={labelClass}>What we will improve</label><textarea className={`${inputClass} min-h-[70px]`} value={whatToImprove} onChange={(e) => setWhatToImprove(e.target.value)} /></div>
        </div>

        <div>
          <label className={labelClass}>Plan for next month (up to 4 reels)</label>
          <div className="space-y-2">
            {ideas.map((idea, i) => (
              <input
                key={i}
                className={inputClass}
                placeholder={`Reel ${i + 1}`}
                value={idea}
                onChange={(e) => setIdeas((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
              />
            ))}
          </div>
        </div>

        <div>
          <label className={labelClass}>Our suggestion (continue monthly, move to quarterly, etc.)</label>
          <input className={inputClass} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
        </div>

        {saved && <p className="text-emerald-400 text-sm">Report saved.</p>}

        <button
          onClick={handleSave}
          disabled={saving || !clientId}
          className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-60 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-sm"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? "Saving…" : "Save Report"}
        </button>
      </div>
    </div>
  );
}

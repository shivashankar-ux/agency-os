"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Plus, Copy, Check, Lock, Eye, Mail, Star, Users,
  AlertCircle, ChevronRight, CheckCircle2, ShieldCheck, X
} from "lucide-react";
import { createFeedbackRound, closeFeedbackRound, QuestionItem } from "@/app/actions/feedback";

interface ProfileItem {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface FeedbackRound {
  id: string;
  title: string;
  status: string;
  created_at: string;
  questions: QuestionItem[];
}

interface FeedbackToken {
  id: string;
  token: string;
  round_id: string;
  giver_user_id: string;
  used: boolean;
}

interface FeedbackResponse {
  id: string;
  round_id: string;
  giver_user_id?: string; // Only present for Captain
  receiver_user_id: string;
  answers: { question_id: string; prompt: string; type: string; answer: string | number }[];
  submitted_at: string;
}

interface FeedbackDashboardClientProps {
  currentProfile: ProfileItem;
  allProfiles: ProfileItem[];
  rounds: FeedbackRound[];
  tokens: FeedbackToken[];
  responses: FeedbackResponse[];
  isCaptain: boolean;
}

export default function FeedbackDashboardClient({
  currentProfile,
  allProfiles,
  rounds,
  tokens,
  responses,
  isCaptain,
}: FeedbackDashboardClientProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string>(
    rounds[0]?.id || ""
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // New Round Form State
  const [roundTitle, setRoundTitle] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    allProfiles.map((p) => p.id)
  );
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { id: "1", prompt: "Communication & Clarity", type: "rating" },
    { id: "2", prompt: "Ownership & Reliability", type: "rating" },
    { id: "3", prompt: "Quality of Work", type: "rating" },
    { id: "4", prompt: "What are their biggest strengths & areas for growth?", type: "text" },
  ]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  const handleCopyLink = (token: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/feedback/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const handleAddQuestion = (type: "rating" | "text") => {
    const newQ: QuestionItem = {
      id: Date.now().toString(),
      prompt: type === "rating" ? "New Performance Rating Criteria" : "New Feedback Question",
      type,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  const handleQuestionChange = (id: string, field: "prompt" | "type", value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setCreating(true);

    const formData = new FormData();
    formData.append("title", roundTitle);
    formData.append("questions", JSON.stringify(questions));
    selectedParticipants.forEach((pId) => formData.append("participant_ids", pId));

    const res = await createFeedbackRound(formData);
    setCreating(false);

    if (res.error) {
      setFormError(res.error);
    } else {
      setIsModalOpen(false);
      setRoundTitle("");
    }
  };

  const handleCloseRound = async (rId: string) => {
    if (!confirm("Are you sure you want to close this feedback round? No more submissions will be accepted.")) return;
    await closeFeedbackRound(rId);
  };

  // Filter responses for selected round
  const roundResponses = responses.filter((r) => r.round_id === selectedRoundId);
  const roundTokens = tokens.filter((t) => t.round_id === selectedRoundId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-850 pb-5">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={22} />
            360° Team Feedback
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5">
            {isCaptain
              ? "Captain View — Full 360° mapping, link generation & submission tracking"
              : "Anonymous Feedback Feed — Your performance feedback from teammates"}
          </p>
        </div>

        {isCaptain && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus size={16} /> Create Feedback Round
          </button>
        )}
      </div>

      {/* Main Content Body */}
      {rounds.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-white font-bold text-sm">No Active Feedback Rounds</h3>
          <p className="text-neutral-500 text-xs leading-relaxed">
            {isCaptain
              ? "Click 'Create Feedback Round' above to initiate a new 360° feedback cycle for your team."
              : "There are currently no feedback rounds created by the Captain."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Round Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-900">
            {rounds.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoundId(r.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  r.id === selectedRoundId
                    ? "bg-neutral-800 text-white border-neutral-700 shadow-md"
                    : "bg-neutral-950 text-neutral-500 border-neutral-900 hover:text-neutral-300"
                }`}
              >
                <span>{r.title}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    r.status === "active" ? "bg-emerald-500" : "bg-neutral-600"
                  }`}
                />
              </button>
            ))}
          </div>

          {selectedRound && (
            <div className="space-y-6">
              {/* Captain Section: Magic Links & Submission Progress */}
              {isCaptain && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck size={16} className="text-indigo-400" /> Captain Link Manager & Progress
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Share these unique magic links with team members. They complete feedback without logging in.
                      </p>
                    </div>
                    {selectedRound.status === "active" && (
                      <button
                        onClick={() => handleCloseRound(selectedRound.id)}
                        className="text-xs text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                      >
                        Close Round
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {roundTokens.map((t) => {
                      const giver = allProfiles.find((p) => p.id === t.giver_user_id);
                      return (
                        <div
                          key={t.id}
                          className="bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-white truncate">{giver?.name || "Member"}</p>
                            <p className="text-xxs text-neutral-500 flex items-center gap-1 mt-0.5">
                              Status:{" "}
                              <span className={t.used ? "text-emerald-400 font-bold" : "text-amber-400 font-semibold"}>
                                {t.used ? "Submitted ✓" : "Pending"}
                              </span>
                            </p>
                          </div>
                          <button
                            onClick={() => handleCopyLink(t.token, t.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white text-xs font-semibold transition-colors shrink-0"
                          >
                            {copiedTokenId === t.id ? (
                              <>
                                <Check size={13} className="text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy size={13} /> Copy Link
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 360 Matrix Feed / Private Anonymous Dashboard */}
              <div className="space-y-4">
                {!isCaptain ? (
                  /* ── MEMBER PRIVATE DASHBOARD & ANALYTICS ── */
                  <div className="space-y-6">
                    {/* Scores Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(() => {
                        const ratingAnswers = roundResponses.flatMap((r) =>
                          r.answers.filter((a) => a.type === "rating" && Number(a.answer) > 0)
                        );
                        const avgRating = ratingAnswers.length
                          ? (
                              ratingAnswers.reduce((s, a) => s + Number(a.answer), 0) /
                              ratingAnswers.length
                            ).toFixed(1)
                          : "N/A";

                        return [
                          { label: "Overall Score", val: avgRating === "N/A" ? "N/A" : `${avgRating} / 5`, color: "text-amber-400" },
                          { label: "Reviews Received", val: roundResponses.length, color: "text-indigo-400" },
                          { font: true, label: "Top Strengths", val: "Collaboration, Ownership", color: "text-emerald-400" },
                          { font: true, label: "Focus Areas", val: "Proactive Updates", color: "text-yellow-400" },
                        ].map((stat, sIdx) => (
                          <div key={sIdx} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
                            <p className="text-neutral-500 text-xxs font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className={`text-base font-bold mt-1 ${stat.color}`}>{stat.val}</p>
                          </div>
                        ));
                      })()}
                    </div>

                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users size={16} className="text-indigo-400" />
                      Anonymous Feedback Written About You
                    </h3>

                    {roundResponses.length === 0 ? (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs italic">
                        No feedback responses submitted for you yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {roundResponses.map((resp, rIdx) => (
                          <div
                            key={resp.id}
                            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4"
                          >
                            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                              <span className="font-bold text-neutral-300 text-xs flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xxs text-indigo-400 font-bold">
                                  #{rIdx + 1}
                                </span>
                                Anonymous Reviewer #{rIdx + 1}
                              </span>
                              <span className="text-xxs text-neutral-500">
                                {new Date(resp.submitted_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {resp.answers.map((a, idx) => (
                                <div
                                  key={idx}
                                  className="bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 space-y-1.5"
                                >
                                  <p className="text-xxs font-bold text-neutral-400 uppercase tracking-wider">
                                    {a.prompt}
                                  </p>
                                  <div className="text-xs text-white">
                                    {a.type === "rating" ? (
                                      <div className="flex items-center gap-1 font-bold text-amber-400">
                                        <Star size={14} className="fill-amber-400" />
                                        <span>{a.answer} / 5</span>
                                      </div>
                                    ) : (
                                      <p className="text-neutral-300 leading-relaxed italic">{a.answer || "—"}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── CAPTAIN 360 MATRIX VIEW ── */
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Users size={16} className="text-indigo-400" />
                      Full 360° Feedback Matrix
                    </h3>

                    {roundResponses.length === 0 ? (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs italic">
                        No feedback responses submitted for this round yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {roundResponses.map((resp) => {
                          const giver = allProfiles.find((p) => p.id === resp.giver_user_id);
                          const receiver = allProfiles.find((p) => p.id === resp.receiver_user_id);

                          return (
                            <div
                              key={resp.id}
                              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 hover:border-neutral-750 transition-colors"
                            >
                              <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-indigo-400">{giver?.name || "Unknown"}</span>
                                  <ChevronRight size={14} className="text-neutral-600" />
                                  <span className="font-bold text-emerald-400">{receiver?.name}</span>
                                </div>
                                <span className="text-xxs text-neutral-500">
                                  {new Date(resp.submitted_at).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {resp.answers.map((a, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-neutral-950 border border-neutral-850 rounded-xl p-3.5 space-y-1.5"
                                  >
                                    <p className="text-xxs font-bold text-neutral-400 uppercase tracking-wider">
                                      {a.prompt}
                                    </p>
                                    <div className="text-xs text-white">
                                      {a.type === "rating" ? (
                                        <div className="flex items-center gap-1 font-bold text-amber-400">
                                          <Star size={14} className="fill-amber-400" />
                                          <span>{a.answer} / 5</span>
                                        </div>
                                      ) : (
                                        <p className="text-neutral-300 leading-relaxed italic">{a.answer || "—"}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Feedback Round */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={18} />
                  New 360° Feedback Round
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <p>{formError}</p>
                </div>
              )}

              <form onSubmit={handleCreateRound} className="space-y-6 text-xs">
                <div className="space-y-1.5">
                  <label className="text-neutral-300 font-bold block">Round Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 2026 Team 360° Review"
                    value={roundTitle}
                    onChange={(e) => setRoundTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Question Set Builder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-300 font-bold block">Questions / Rating Parameters</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("rating")}
                        className="text-xxs bg-neutral-800 hover:bg-neutral-750 text-indigo-400 px-2.5 py-1 rounded-lg font-semibold border border-neutral-700"
                      >
                        + Rating (1-5)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddQuestion("text")}
                        className="text-xxs bg-neutral-800 hover:bg-neutral-750 text-indigo-400 px-2.5 py-1 rounded-lg font-semibold border border-neutral-700"
                      >
                        + Text Prompt
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-2 bg-neutral-950 border border-neutral-850 p-2.5 rounded-xl"
                      >
                        <span className="text-neutral-600 font-bold w-4 text-center">{idx + 1}</span>
                        <input
                          type="text"
                          value={q.prompt}
                          onChange={(e) => handleQuestionChange(q.id, "prompt", e.target.value)}
                          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                        <select
                          value={q.type}
                          onChange={(e) => handleQuestionChange(q.id, "type", e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-lg px-2 py-1.5 text-xxs focus:outline-none"
                        >
                          <option value="rating">Rating (1-5)</option>
                          <option value="text">Text</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-neutral-500 hover:text-red-400 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Team Members */}
                <div className="space-y-2">
                  <label className="text-neutral-300 font-bold block">Included Team Members</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allProfiles.map((p) => {
                      const isChecked = selectedParticipants.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setSelectedParticipants((prev) =>
                              isChecked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                            )
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left border transition-all ${
                            isChecked
                              ? "bg-indigo-950/60 border-indigo-800 text-indigo-200"
                              : "bg-neutral-950 border-neutral-850 text-neutral-500"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border text-xxs ${
                              isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-neutral-700"
                            }`}
                          >
                            {isChecked && "✓"}
                          </div>
                          <span className="truncate">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-neutral-400 hover:text-white font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-900/30"
                  >
                    {creating ? "Creating..." : "Launch Round"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

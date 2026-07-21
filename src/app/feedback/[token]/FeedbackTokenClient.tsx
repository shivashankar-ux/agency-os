"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, User, Star, AlertCircle, Loader2, Send } from "lucide-react";
import { submitFeedbackBatch } from "@/app/actions/feedback";

interface Participant {
  id: string;
  name: string;
  role: string;
}

interface Question {
  id: string;
  prompt: string;
  type: "rating" | "text";
}

interface FeedbackTokenClientProps {
  token: string;
  roundTitle: string;
  giverName: string;
  giverUserId?: string;
  questions: Question[];
  participants: Participant[];
  allParticipants: Participant[];
}

export default function FeedbackTokenClient({
  token,
  roundTitle,
  giverName,
  giverUserId,
  questions,
  participants: initialParticipants,
  allParticipants,
}: FeedbackTokenClientProps) {
  const [selectedGiverId, setSelectedGiverId] = useState<string>(giverUserId || "");
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state: map of receiverUserId -> questionId -> value
  const [feedbackData, setFeedbackData] = useState<
    Record<string, Record<string, string | number>>
  >({});

  // Filter participants to review: exclude selected giver
  const participants = selectedGiverId
    ? allParticipants.filter((p) => p.id !== selectedGiverId)
    : allParticipants;

  const activeParticipant = participants[activeIdx];
  const activeGiverName = allParticipants.find((p) => p.id === selectedGiverId)?.name || giverName;

  const handleInputChange = (receiverId: string, qId: string, value: string | number) => {
    setFeedbackData((prev) => ({
      ...prev,
      [receiverId]: {
        ...(prev[receiverId] || {}),
        [qId]: value,
      },
    }));
  };

  const isCurrentCompleted = () => {
    if (!activeParticipant) return false;
    const pData = feedbackData[activeParticipant.id] || {};
    return questions.some((q) => pData[q.id] !== undefined && pData[q.id] !== "");
  };

  const getCompletedCount = () => {
    return participants.filter((p) => {
      const pData = feedbackData[p.id] || {};
      return questions.some((q) => pData[q.id] !== undefined && pData[q.id] !== "");
    }).length;
  };

  const handleSubmitAll = async () => {
    setError(null);

    if (!selectedGiverId) {
      setError("Please select your name under 'I am...' before submitting feedback.");
      return;
    }

    setSubmitting(true);

    const formattedResponses = participants
      .map((p) => {
        const pData = feedbackData[p.id] || {};
        const answers = questions.map((q) => ({
          question_id: q.id,
          prompt: q.prompt,
          type: q.type,
          answer: pData[q.id] ?? (q.type === "rating" ? 0 : ""),
        }));
        return {
          receiver_user_id: p.id,
          answers,
        };
      })
      .filter((resp) => resp.answers.some((a) => a.answer !== 0 && a.answer !== ""));

    if (formattedResponses.length === 0) {
      setError("Please fill out feedback for at least one team member before submitting.");
      setSubmitting(false);
      return;
    }

    const res = await submitFeedbackBatch(token, formattedResponses, selectedGiverId);
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Feedback Submitted!</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Thank you, <strong className="text-white">{activeGiverName}</strong>! Your 360° feedback has been submitted anonymously. Each recipient will receive an automated email notification with your feedback while keeping your identity completely confidential.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-start p-4 sm:p-6">
      {/* Header */}
      <header className="w-full max-w-4xl py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-900 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-600/30">
            360
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">{roundTitle}</h1>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
              <span>I am:</span>
              {giverUserId ? (
                <span className="text-indigo-400 font-bold">{activeGiverName}</span>
              ) : (
                <select
                  value={selectedGiverId}
                  onChange={(e) => {
                    setSelectedGiverId(e.target.value);
                    setActiveIdx(0);
                  }}
                  className="bg-neutral-900 border border-neutral-800 text-indigo-400 font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Your Name --</option>
                  {allParticipants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full font-medium">
            {getCompletedCount()} / {participants.length} Teammates Reviewed
          </span>
        </div>
      </header>

      {/* Main Form Layout */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        {/* Left Side: Teammate Tabs */}
        <div className="md:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2 h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 px-2">
            Team Members ({participants.length})
          </h2>
          <div className="space-y-1.5 max-h-[450px] overflow-y-auto pr-1">
            {participants.map((p, idx) => {
              const pData = feedbackData[p.id] || {};
              const hasFilled = questions.some((q) => pData[q.id] !== undefined && pData[q.id] !== "");
              const isSelected = idx === activeIdx;

              return (
                <button
                  key={p.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20"
                      : "bg-neutral-950/50 hover:bg-neutral-850 text-neutral-300 border border-neutral-850"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xxs shrink-0 ${isSelected ? "bg-white text-indigo-600" : "bg-neutral-800 text-neutral-400"}`}>
                      {p.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate">{p.name}</p>
                      <p className={`text-xxs capitalize truncate ${isSelected ? "text-indigo-200" : "text-neutral-500"}`}>{p.role}</p>
                    </div>
                  </div>
                  {hasFilled && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? "bg-white" : "bg-emerald-500"}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-800 mt-2">
            <button
              onClick={handleSubmitAll}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={15} /> Submit All Feedback
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Questions Form for Selected Teammate */}
        <div className="md:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between">
          {activeParticipant ? (
            <div className="space-y-6">
              {/* Target Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-neutral-850">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-750 flex items-center justify-center text-indigo-400 font-bold text-sm">
                    {activeParticipant.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Feedback for {activeParticipant.name}</h3>
                    <p className="text-xs text-neutral-500 capitalize">{activeParticipant.role}</p>
                  </div>
                </div>
                <span className="text-xxs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950 border border-indigo-900 px-2.5 py-1 rounded-md">
                  Anonymous
                </span>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-900 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-6">
                {questions.map((q, qIdx) => {
                  const currentVal = feedbackData[activeParticipant.id]?.[q.id] ?? "";

                  return (
                    <div key={q.id} className="space-y-2">
                      <label className="text-xs font-semibold text-neutral-300 block">
                        {qIdx + 1}. {q.prompt}
                      </label>

                      {q.type === "rating" ? (
                        <div className="flex items-center gap-2 pt-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isSelected = Number(currentVal) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleInputChange(activeParticipant.id, q.id, star)}
                                className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
                                  isSelected
                                    ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                                    : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                                }`}
                              >
                                <Star
                                  size={16}
                                  className={isSelected ? "fill-amber-400 text-amber-400" : "text-neutral-500"}
                                />
                                <span>{star}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <textarea
                          rows={3}
                          value={String(currentVal)}
                          onChange={(e) => handleInputChange(activeParticipant.id, q.id, e.target.value)}
                          placeholder={`Share honest feedback for ${activeParticipant.name}...`}
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 resize-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-850">
                <button
                  type="button"
                  disabled={activeIdx === 0}
                  onClick={() => setActiveIdx((prev) => prev - 1)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white disabled:opacity-30"
                >
                  ← Previous
                </button>
                {activeIdx < participants.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveIdx((prev) => prev + 1)}
                    className="px-5 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-750 text-white rounded-xl transition-all border border-neutral-700"
                  >
                    Next Teammate →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-xs text-center py-12">No teammate selected.</p>
          )}
        </div>
      </main>
    </div>
  );
}

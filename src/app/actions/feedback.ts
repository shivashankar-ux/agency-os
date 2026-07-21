"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export type QuestionItem = {
  id: string;
  prompt: string;
  type: "rating" | "text";
};

// ── 1. Create Feedback Round (Captain only) ───────────────────
export async function createFeedbackRound(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    return { error: "Only the Captain/Admins can create feedback rounds." };
  }

  const title = formData.get("title") as string;
  const rawQuestions = formData.get("questions") as string;
  const participantIds = formData.getAll("participant_ids") as string[];

  if (!title || !title.trim()) return { error: "Title is required." };
  
  let questions: QuestionItem[] = [];
  try {
    questions = JSON.parse(rawQuestions || "[]");
  } catch {
    return { error: "Invalid questions format." };
  }

  if (questions.length === 0) {
    return { error: "Please add at least one question." };
  }

  // Insert round
  const { data: round, error: roundErr } = await supabase
    .from("feedback_rounds")
    .insert({
      org_id: profile.org_id,
      title: title.trim(),
      questions,
      created_by: user.id,
      status: "active",
    })
    .select()
    .single();

  if (roundErr) {
    console.error("Error creating round:", roundErr);
    return { error: roundErr.message };
  }

  // Insert participants
  if (participantIds.length > 0) {
    const participantRows = participantIds.map((pId) => ({
      round_id: round.id,
      user_id: pId,
    }));

    await supabase.from("feedback_round_participants").insert(participantRows);
  }

  // Auto-generate tokens for each participant
  if (participantIds.length > 0) {
    const tokenRows = participantIds.map((giverId) => ({
      round_id: round.id,
      giver_user_id: giverId,
    }));

    await supabase.from("feedback_tokens").insert(tokenRows);
  }

  revalidatePath("/dashboard/feedback");
  return { success: true, roundId: round.id };
}

// ── 2. Get or Generate Unique Magic Link Token ─────────────────
export async function getOrCreateFeedbackToken(roundId: string, giverUserId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("feedback_tokens")
    .select("token")
    .eq("round_id", roundId)
    .eq("giver_user_id", giverUserId)
    .maybeSingle();

  if (existing) return { token: existing.token };

  const { data: newToken, error } = await supabase
    .from("feedback_tokens")
    .insert({
      round_id: roundId,
      giver_user_id: giverUserId,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };
  return { token: newToken.token };
}

// ── 3. Submit Anonymous Feedback (Public / Member) ─────────────
export async function submitFeedbackBatch(
  token: string,
  responses: {
    receiver_user_id: string;
    answers: { question_id: string; prompt: string; type: string; answer: string | number }[];
  }[]
) {
  const supabase = await createClient();

  // Validate token
  const { data: tokenData, error: tokenErr } = await supabase
    .from("feedback_tokens")
    .select("*, feedback_rounds(*)")
    .eq("token", token)
    .single();

  if (tokenErr || !tokenData) {
    return { error: "Invalid or expired feedback link." };
  }

  const round = tokenData.feedback_rounds;
  if (!round || round.status === "closed") {
    return { error: "This feedback round is closed." };
  }

  const giverUserId = tokenData.giver_user_id;
  const orgId = round.org_id;

  const insertRows = responses.map((r) => ({
    org_id: orgId,
    round_id: round.id,
    giver_user_id: giverUserId,
    receiver_user_id: r.receiver_user_id,
    answers: r.answers,
  }));

  const { data: insertedResponses, error: insertErr } = await supabase
    .from("feedback_responses")
    .insert(insertRows)
    .select("*, receiver:profiles!feedback_responses_receiver_user_id_fkey(email, name)");

  if (insertErr) {
    console.error("Error inserting feedback responses:", insertErr);
    return { error: insertErr.message };
  }

  // Mark token as used
  await supabase
    .from("feedback_tokens")
    .update({ used: true })
    .eq("token", token);

  // Send anonymous emails to each reviewed participant asynchronously
  if (insertedResponses && insertedResponses.length > 0) {
    for (const resp of insertedResponses) {
      const receiverEmail = (resp.receiver as any)?.email;
      const receiverName = (resp.receiver as any)?.name || "Team Member";

      if (receiverEmail) {
        try {
          const answersHtml = (resp.answers as any[])
            .map(
              (a) => `
              <div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-left: 3px solid #6366f1; border-radius: 6px;">
                <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #475569;">${a.prompt}</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: ${a.type === 'rating' ? 'bold' : 'normal'};">
                  ${a.type === 'rating' ? `⭐ ${a.answer} / 5` : a.answer || '<em>No answer provided</em>'}
                </p>
              </div>
            `
            )
            .join("");

          await resend.emails.send({
            from: "The Story Builder <shivashankar.7991@gmail.com>",
            to: receiverEmail,
            subject: `💬 New Feedback Received (${round.title})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
                <h2 style="color: #4f46e5; margin-bottom: 8px;">Hello ${receiverName},</h2>
                <p style="margin-bottom: 24px;">You have received new anonymous 360° feedback for the round: <strong>${round.title}</strong>.</p>
                
                <h4 style="color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">Feedback Summary:</h4>
                ${answersHtml}

                <div style="margin-top: 32px; padding-top: 16px; border-t: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
                  <p>This is an automated 360° feedback notification from <strong>Agency OS</strong>. Sender identity is completely confidential.</p>
                </div>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error("Failed to send feedback notification email:", emailErr);
        }
      }
    }
  }

  return { success: true };
}

// ── 4. Close Feedback Round (Captain only) ──────────────────────
export async function closeFeedbackRound(roundId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("feedback_rounds")
    .update({ status: "closed" })
    .eq("id", roundId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/feedback");
  return { success: true };
}

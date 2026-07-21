import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import FeedbackTokenClient from "./FeedbackTokenClient";

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const adminSupabase = createAdminClient();

  let giverUserId: string | null = null;
  let round: any = null;
  let giverName = "";

  // 1. Try finding by magic token
  const { data: tokenData } = await adminSupabase
    .from("feedback_tokens")
    .select(`
      id, token, used, giver_user_id,
      feedback_rounds (
        id, title, questions, status,
        feedback_round_participants ( user_id )
      )
    `)
    .eq("token", token)
    .maybeSingle();

  if (tokenData && tokenData.feedback_rounds) {
    round = tokenData.feedback_rounds;
    giverUserId = tokenData.giver_user_id;

    const { data: giverProfile } = await adminSupabase
      .from("profiles")
      .select("name")
      .eq("id", giverUserId)
      .single();
    giverName = giverProfile?.name || "Team Member";
  } else {
    // 2. Try finding by round_id (Single Shared Link Mode)
    const { data: roundData } = await adminSupabase
      .from("feedback_rounds")
      .select(`
        id, title, questions, status,
        feedback_round_participants ( user_id )
      `)
      .eq("id", token)
      .maybeSingle();

    if (!roundData) {
      notFound();
    }
    round = roundData;
    giverName = "Select Your Name";
  }

  if (round.status === "closed") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 text-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-md w-full">
          <h1 className="text-xl font-bold text-white mb-2">Round Closed</h1>
          <p className="text-neutral-400 text-xs leading-relaxed">
            This 360° feedback round has been marked as closed by the Captain.
          </p>
        </div>
      </div>
    );
  }

  // Fetch all participants for this round using admin client (bypasses RLS for public link)
  const participantUserIds = (round.feedback_round_participants || []).map(
    (p: any) => p.user_id
  );

  let allParticipants: { id: string; name: string; role: string }[] = [];
  if (participantUserIds.length > 0) {
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, name, role")
      .in("id", participantUserIds);

    allParticipants = profiles || [];
  }

  // Filter out giver if known, otherwise pass all participants
  const participants = giverUserId
    ? allParticipants.filter((p) => p.id !== giverUserId)
    : allParticipants;

  return (
    <FeedbackTokenClient
      token={token}
      roundTitle={round.title}
      giverName={giverName}
      giverUserId={giverUserId || undefined}
      questions={round.questions || []}
      participants={participants}
      allParticipants={allParticipants}
    />
  );
}

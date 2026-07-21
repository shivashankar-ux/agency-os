import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import FeedbackTokenClient from "./FeedbackTokenClient";

export default async function FeedbackTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Validate token
  const { data: tokenData, error } = await supabase
    .from("feedback_tokens")
    .select(`
      id,
      token,
      used,
      giver_user_id,
      feedback_rounds (
        id,
        title,
        questions,
        status,
        feedback_round_participants (
          user_id
        )
      )
    `)
    .eq("token", token)
    .maybeSingle();

  if (error || !tokenData || !tokenData.feedback_rounds) {
    notFound();
  }

  const round = tokenData.feedback_rounds as any;

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

  // Get giver profile details
  const { data: giverProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", tokenData.giver_user_id)
    .single();

  // Fetch participants for this round
  const participantUserIds = (round.feedback_round_participants || []).map(
    (p: any) => p.user_id
  );

  let participants: { id: string; name: string; role: string }[] = [];
  if (participantUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, role")
      .in("id", participantUserIds);

    participants = profiles || [];
  }

  return (
    <FeedbackTokenClient
      token={token}
      roundTitle={round.title}
      giverName={giverProfile?.name || "Team Member"}
      questions={round.questions || []}
      participants={participants}
    />
  );
}

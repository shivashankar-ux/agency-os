import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FeedbackDashboardClient from "./FeedbackDashboardClient";

export default async function FeedbackDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const isCaptain = profile.role === "owner" || profile.role === "admin";

  // Fetch all profiles in org
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role, email")
    .eq("org_id", profile.org_id);

  // Fetch feedback rounds
  const { data: rounds } = await supabase
    .from("feedback_rounds")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  // Fetch tokens (Captain sees all, members see nothing)
  let tokens: any[] = [];
  if (isCaptain) {
    const { data: tokenData } = await supabase
      .from("feedback_tokens")
      .select("*");
    tokens = tokenData || [];
  }

  // Fetch responses
  // Captain gets full feedback_responses, Members get anonymous_feedback_responses
  let responses: any[] = [];
  if (isCaptain) {
    const { data: respData } = await supabase
      .from("feedback_responses")
      .select("*")
      .eq("org_id", profile.org_id)
      .order("submitted_at", { ascending: false });
    responses = respData || [];
  } else {
    const { data: anonData } = await supabase
      .from("anonymous_feedback_responses")
      .select("*")
      .eq("org_id", profile.org_id)
      .eq("receiver_user_id", user.id)
      .order("submitted_at", { ascending: false });
    responses = anonData || [];
  }

  return (
    <FeedbackDashboardClient
      currentProfile={profile}
      allProfiles={profiles || []}
      rounds={rounds || []}
      tokens={tokens}
      responses={responses}
      isCaptain={isCaptain}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { notFound, redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

type Props = { params: Promise<{ id: string }> };

export default async function OnboardingPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();

  const { data: client } = await supabase.from("clients").select("id, name").eq("id", id).single();
  if (!client) notFound();

  const { data: onboarding } = await supabase
    .from("client_onboarding")
    .select("*")
    .eq("client_id", id)
    .maybeSingle();

  return (
    <OnboardingClient
      client={client}
      initialResponses={onboarding?.responses || {}}
      submittedAt={onboarding?.submitted_at || null}
      profile={profile}
    />
  );
}

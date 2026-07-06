import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import AIPageClient from "./AIPageClient";

export const metadata = {
  title: "AI Copilot | Agency OS",
  description: "AI generation workspace for marketing copy, emails and search optimization.",
};

export default async function AIPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canUseAI =
    permissions?.ai?.proposal_generator?.allowed ||
    permissions?.ai?.marketing_ai?.allowed ||
    permissions?.ai?.caption_generator?.allowed;

  if (!canUseAI) {
    redirect("/dashboard");
  }

  return <AIPageClient profile={profile} />;
}

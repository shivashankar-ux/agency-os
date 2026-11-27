import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import ContentPageClient from "./ContentPageClient";

export const metadata = {
  title: "Content | Agency OS",
  description: "Reel scripts, approvals, shoot & editor checklists.",
};

export default async function ContentPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  if (!permissions?.content?.view?.allowed) redirect("/dashboard");

  const supabase = await createClient();

  const [reelsRes, clientsRes] = await Promise.all([
    supabase
      .from("reels")
      .select("*, clients(name)")
      .order("scheduled_shoot_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("org_id", profile.org_id)
      .order("name"),
  ]);

  return (
    <ContentPageClient
      initialReels={reelsRes.data || []}
      clients={clientsRes.data || []}
      profile={profile}
    />
  );
}

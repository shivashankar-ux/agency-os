import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import CRMPageClient from "./CRMPageClient";

export default async function CRMPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canViewCRM = permissions?.crm?.view?.allowed ?? false;
  if (!canViewCRM) redirect("/dashboard");

  const supabase = await createClient();

  // Fetch org_id for the current user
  const { data: profileData } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", profile.id)
    .single();

  const orgId = profileData?.org_id;
  if (!orgId) redirect("/dashboard");

  // Fetch leads + assignee in parallel with all profiles
  const [{ data: leads }, { data: allProfiles }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, company_name, contact_name, contact_email, contact_phone, website, source, stage, deal_value, expected_close_date, notes, tags, assigned_to, created_by, created_at, assignee:profiles!leads_assigned_to_fkey(name, role)"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, name, role")
      .order("name", { ascending: true }),
  ]);

  return (
    <CRMPageClient
      initialLeads={(leads ?? []) as any}
      allProfiles={(allProfiles ?? []) as any}
      permissions={permissions}
      orgId={orgId}
      userId={profile.id}
    />
  );
}

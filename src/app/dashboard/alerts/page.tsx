import { redirect } from "next/navigation";
import AlertsClient from "./AlertsClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function AlertsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const supabase = await createClient();

  // Fetch ALL active team members in org (INCLUDING the logged-in user / captain / owner)
  const [{ data: employees }, { data: clients }, { data: alerts }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, role").eq("org_id", profile.org_id).eq("is_active", true).order("name"),
    supabase.from("clients").select("id, name").eq("org_id", profile.org_id).order("name"),
    supabase.from("email_alerts").select("id, subject, message, scheduled_for, schedule_type, target_date, occurrences_per_day, sent_count, status, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email), recipient_email, recipient_name").eq("org_id", profile.org_id).order("created_at", { ascending: false }).limit(30),
  ]);

  const { data: assignments } = clients?.length
    ? await supabase.from("client_assignments").select("client_id, user_id").in("client_id", clients.map((client) => client.id))
    : { data: [] };

  return (
    <AlertsClient
      currentUserId={profile.id}
      employees={employees || []}
      clients={clients || []}
      assignments={assignments || []}
      alerts={(alerts || []) as any[]}
    />
  );
}
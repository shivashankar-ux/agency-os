import { redirect } from "next/navigation";
import AlertsClient from "./AlertsClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function AlertsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !["owner", "admin"].includes(profile.role)) redirect("/dashboard");

  const adminSupabase = createAdminClient();

  // Fetch ALL active team members in the system using admin client (bypasses RLS)
  const [{ data: employees }, { data: clients }, { data: alerts }] = await Promise.all([
    adminSupabase
      .from("profiles")
      .select("id, name, email, role")
      .order("name", { ascending: true }),
    adminSupabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true }),
    adminSupabase
      .from("email_alerts")
      .select(
        "id, subject, message, scheduled_for, schedule_type, target_date, occurrences_per_day, sent_count, status, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email), recipient_email, recipient_name"
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const { data: assignments } = clients?.length
    ? await adminSupabase
        .from("client_assignments")
        .select("client_id, user_id")
        .in("client_id", clients.map((client) => client.id))
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
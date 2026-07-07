import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import ReportsPageClient from "./ReportsPageClient";

export const metadata = {
  title: "Reports & Analytics | Agency OS",
  description: "Monitor team productivity, profit margins, and project portfolios.",
};

export default async function ReportsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canViewReports = permissions?.reports?.view?.allowed ?? false;
  if (!canViewReports) redirect("/dashboard");

  const supabase = await createClient();

  // Fetch org_id
  const { data: profileData } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", profile.id)
    .single();

  const orgId = profileData?.org_id;
  if (!orgId) redirect("/dashboard");

  // Fetch parallel analytics data
  const [
    { data: invoices },
    { data: expenses },
    { data: tasks },
    { data: projects },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("id, amount, total_amount, status, issue_date, client:clients(name)")
      .order("issue_date", { ascending: false }),

    supabase
      .from("expenses")
      .select("id, amount, category, expense_date, client:clients(name)")
      .eq("org_id", orgId)
      .order("expense_date", { ascending: false }),

    supabase
      .from("tasks")
      .select("id, status, priority, assigned_to, assignee:profiles(name)")
      .order("created_at", { ascending: false }),

    supabase
      .from("projects")
      .select("id, name, status")
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <ReportsPageClient
      invoices={(invoices ?? []) as any}
      expenses={(expenses ?? []) as any}
      tasks={(tasks ?? []) as any}
      projects={(projects ?? []) as any}
      profiles={(profiles ?? []) as any}
      permissions={permissions}
    />
  );
}

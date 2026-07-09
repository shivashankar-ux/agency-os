import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyTaskFilters } from "@/lib/permissions";
import { redirect } from "next/navigation";
import CalendarPageClient from "./CalendarPageClient";

export const metadata = {
  title: "Calendar | Agency OS",
  description: "Manage events, deadlines, and meetings across your agency.",
};

export default async function CalendarPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canViewCalendar = permissions?.calendar?.view?.allowed ?? false;
  if (!canViewCalendar) redirect("/dashboard");

  const supabase = await createClient();

  // Fetch org_id
  const { data: profileData } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", profile.id)
    .single();

  const orgId = profileData?.org_id;
  if (!orgId) redirect("/dashboard");

  const taskScope = permissions?.tasks?.view?.scope ?? "all";

  // ── Parallel data fetch ──────────────────────────────────────
  let tasksQuery = supabase
    .from("tasks")
    .select("id, title, description, due_date, status, priority, assigned_to, project_id, projects(name, clients(name)), assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
    .neq("status", "done");
  tasksQuery = await applyTaskFilters(tasksQuery, profile.id, taskScope);

  const [
    { data: calendarEvents },
    { data: taskEvents },
    { data: milestoneEvents },
    { data: allProfiles },
    { data: allClients },
    { data: allProjects },
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .eq("org_id", orgId)
      .order("start_at", { ascending: true }),

    tasksQuery,

    supabase
      .from("milestones")
      .select("id, title, due_date, status")
      .not("due_date", "is", null)
      .neq("status", "completed"),

    supabase
      .from("profiles")
      .select("id, name")
      .order("name", { ascending: true }),

    supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true }),

    supabase
      .from("projects")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  return (
    <CalendarPageClient
      initialEvents={(calendarEvents ?? []) as any}
      taskEvents={(taskEvents ?? []) as any}
      milestoneEvents={(milestoneEvents ?? []) as any}
      allProfiles={(allProfiles ?? []) as any}
      allClients={(allClients ?? []) as any}
      allProjects={(allProjects ?? []) as any}
      permissions={permissions}
      orgId={orgId}
      currentProfile={profile as any}
    />
  );
}

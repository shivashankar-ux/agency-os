import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyProjectFilters, applyTaskFilters } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import ClientDetailClient from "./ClientDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Resolve user permissions
  const permissions = await getPermissions(profile.id);
  const canViewClients = permissions.clients?.view?.allowed || false;

  if (!canViewClients) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch client details
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (clientError || !client) {
    notFound();
  }

  // Scope gating for single client view
  const clientScope = permissions.clients?.view?.scope || "all";
  if (clientScope === "own" && client.created_by !== profile.id) {
    const { count } = await supabase
      .from("client_assignments")
      .select("*", { count: "exact", head: true })
      .eq("client_id", id)
      .eq("user_id", profile.id);
    if (!count) {
      redirect("/dashboard/clients");
    }
  }

  // Fetch projects (scoped)
  let projectsQuery = supabase
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  projectsQuery = await applyProjectFilters(projectsQuery, profile.id, permissions.projects?.view?.scope || "all");
  const { data: projects } = await projectsQuery;

  const projectIds = projects?.map((p) => p.id) || [];

  // Fetch tasks (scoped)
  let tasksQuery = supabase
    .from("tasks")
    .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });
  tasksQuery = await applyTaskFilters(tasksQuery, profile.id, permissions.tasks?.view?.scope || "all");
  const { data: tasks } = projectIds.length > 0 ? await tasksQuery : { data: [] };

  // Fetch client assignments
  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("*, profiles(id, name, email, role)")
    .eq("client_id", id);

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, org_id, name, email, role, job_title")
    .order("name", { ascending: true });

  // Fetch files (scoped to client)
  const { data: clientFiles } = await supabase
    .from("files")
    .select(`
      *,
      uploader:profiles!files_created_by_fkey(name),
      project:projects!files_project_id_fkey(name)
    `)
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  return (
    <ClientDetailClient
      client={client}
      projects={projects || []}
      tasks={tasks || []}
      assignments={assignments || []}
      allProfiles={allProfiles || []}
      currentProfile={profile}
      permissions={permissions}
      initialFiles={clientFiles || []}
    />
  );
}

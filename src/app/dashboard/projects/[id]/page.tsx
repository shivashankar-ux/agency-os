import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyTaskFilters } from "@/lib/permissions";
import { notFound, redirect } from "next/navigation";
import ProjectWorkspaceClient from "./ProjectWorkspaceClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectWorkspacePage({ params }: Props) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canViewProjects = permissions.projects?.view?.allowed ?? false;
  if (!canViewProjects) redirect("/dashboard");

  const supabase = await createClient();

  // ── Fetch project + verify access ──────────────────────────────
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) notFound();

  // ── Fetch client for breadcrumb ─────────────────────────────────
  const { data: client } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", project.client_id)
    .single();

  if (!client) notFound();

  // ── Parallel data fetching ──────────────────────────────────────
  const taskScope = permissions.tasks?.view?.scope ?? "all";

  let tasksQuery = supabase
    .from("tasks")
    .select("id, title, status, priority, due_date, assigned_to, assignee:profiles!tasks_assigned_to_fkey(id, name)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });
  tasksQuery = await applyTaskFilters(tasksQuery, profile.id, taskScope);

  const [
    { data: tasks },
    { data: milestones },
    { data: deliverables },
    { data: comments },
    { data: teamMembers },
    { data: allProfiles },
  ] = await Promise.all([
    tasksQuery,

    supabase
      .from("milestones")
      .select("id, title, description, status, due_date")
      .eq("project_id", id)
      .order("due_date", { ascending: true }),

    supabase
      .from("deliverables")
      .select(
        "id, title, status, due_date, notes, assigned_to, milestone_id, assignee:profiles!deliverables_assigned_to_fkey(name)"
      )
      .eq("project_id", id)
      .order("created_at", { ascending: false }),

    // Activity: task_comments joined across all project tasks
    supabase
      .from("task_comments")
      .select(
        "id, content, created_at, user:profiles!task_comments_user_id_fkey(name, role)"
      )
      .in(
        "task_id",
        // sub-select task ids for this project — use a flat array if tasks loaded
        [] // placeholder; overridden below
      )
      .order("created_at", { ascending: false })
      .limit(50),

    // Team: users assigned to tasks in this project (deduplicated proxy)
    supabase
      .from("client_assignments")
      .select("profiles(id, name, email, role, job_title)")
      .eq("client_id", project.client_id),

    supabase
      .from("profiles")
      .select("id, name, role, email")
      .order("name", { ascending: true }),
  ]);

  // Fetch comments properly using loaded task ids
  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: activityComments } = taskIds.length > 0
    ? await supabase
        .from("task_comments")
        .select("id, content, created_at, user:profiles!task_comments_user_id_fkey(name, role)")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <ProjectWorkspaceClient
      project={project}
      client={client}
      tasks={(tasks ?? []) as any}
      milestones={(milestones ?? []) as any}
      deliverables={(deliverables ?? []) as any}
      comments={(activityComments ?? []) as any}
      teamMembers={(teamMembers ?? []) as any}
      allProfiles={(allProfiles ?? []) as any}
      permissions={permissions}
    />
  );
}

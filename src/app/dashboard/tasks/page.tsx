import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyTaskFilters } from "@/lib/permissions";
import { redirect } from "next/navigation";
import TasksListClient from "./TasksListClient";

export default async function TasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Resolve user permissions
  const permissions = await getPermissions(profile.id);
  const canViewTasks = permissions.tasks?.view?.allowed || false;
  const taskScope = permissions.tasks?.view?.scope || "all";

  if (!canViewTasks) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // 1. Resolve tasks query builder with permissions filters
  let tasksQuery = supabase
    .from("tasks")
    .select("*, projects(name, clients(name)), assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
    .order("created_at", { ascending: false });

  tasksQuery = await applyTaskFilters(tasksQuery, profile.id, taskScope);

  // 2. Fetch tasks, profiles, and projects in parallel
  const [
    tasksRes,
    profilesRes,
    projectsRes
  ] = await Promise.all([
    tasksQuery,
    supabase
      .from("profiles")
      .select("id, name, role")
      .order("name", { ascending: true }),
    supabase
      .from("projects")
      .select("id, name")
      .order("name", { ascending: true })
  ]);

  if (tasksRes.error) {
    console.error("Failed to load scoped tasks:", tasksRes.error.message);
  }
  if (profilesRes.error) {
    console.error("Failed to load profiles:", profilesRes.error.message);
  }
  if (projectsRes.error) {
    console.error("Failed to load projects:", projectsRes.error.message);
  }

  const tasks = tasksRes.data || [];
  const allProfiles = profilesRes.data || [];
  const allProjects = projectsRes.data || [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-1">Tasks</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {tasks.length} task{tasks.length === 1 ? "" : "s"}
      </p>

      <TasksListClient 
        tasks={tasks as any[]} 
        currentProfile={profile as any} 
        allProfiles={allProfiles as any}
        allProjects={allProjects as any}
      />
    </div>
  );
}

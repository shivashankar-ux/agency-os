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
  let query = supabase
    .from("tasks")
    .select("*, projects(name, clients(name)), assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
    .order("created_at", { ascending: false });

  query = await applyTaskFilters(query, profile.id, taskScope);
  const { data: tasks, error } = await query;
  if (error) {
    console.error("Failed to load scoped tasks:", error.message);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-1">Tasks</h1>
      <p className="text-neutral-500 text-sm mb-6">
        {tasks?.length ?? 0} task{tasks?.length === 1 ? "" : "s"}
      </p>

      <TasksListClient tasks={tasks as any[] || []} currentProfile={profile as any} />
    </div>
  );
}

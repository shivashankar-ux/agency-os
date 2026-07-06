import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import TasksListClient from "./TasksListClient";

export default async function TasksPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, projects(name, clients(name)), assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
    .order("created_at", { ascending: false });

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

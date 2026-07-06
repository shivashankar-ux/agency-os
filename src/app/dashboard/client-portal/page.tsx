import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import ClientPortalClient from "./ClientPortalClient";

export const metadata = {
  title: "Client Portal | Agency OS",
  description: "View projects, tasks, deliverables, and invoices.",
};

export default async function ClientPortalPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // Only allow client role users
  if (profile.role !== "client" || !profile.client_id) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch client details
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", profile.client_id)
    .single();

  if (!client) redirect("/login");

  // Fetch projects in parallel
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", profile.client_id)
    .order("created_at", { ascending: false });

  const projectIds = projects?.map((p) => p.id) || [];

  // Fetch parallel dependencies (tasks, milestones, deliverables, invoices)
  const [
    { data: tasks },
    { data: milestones },
    { data: deliverables },
    { data: invoices },
  ] = await Promise.all([
    projectIds.length > 0
      ? supabase
          .from("tasks")
          .select("*, assignee:profiles!tasks_assigned_to_fkey(name, role)")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),

    projectIds.length > 0
      ? supabase
          .from("milestones")
          .select("*")
          .in("project_id", projectIds)
          .order("due_date", { ascending: true })
      : Promise.resolve({ data: [] }),

    projectIds.length > 0
      ? supabase
          .from("deliverables")
          .select("*, assignee:profiles!deliverables_assigned_to_fkey(name)")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),

    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", profile.client_id)
      .order("issue_date", { ascending: false }),
  ]);

  return (
    <ClientPortalClient
      client={client}
      projects={projects ?? []}
      tasks={tasks ?? []}
      milestones={milestones ?? []}
      deliverables={deliverables ?? []}
      invoices={invoices ?? []}
      profile={profile}
    />
  );
}

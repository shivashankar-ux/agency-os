import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
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

  // Fetch projects
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", id)
    .order("created_at", { ascending: false });

  const projectIds = projects?.map((p) => p.id) || [];

  // Fetch tasks
  const { data: tasks } = projectIds.length > 0
    ? await supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch client assignments
  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("*, profiles(id, name, email, role)")
    .eq("client_id", id);

  // Fetch all profiles in the org
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, job_title")
    .order("name", { ascending: true });

  return (
    <ClientDetailClient
      client={client}
      projects={projects || []}
      tasks={tasks || []}
      assignments={assignments || []}
      allProfiles={allProfiles || []}
      currentProfile={profile}
    />
  );
}

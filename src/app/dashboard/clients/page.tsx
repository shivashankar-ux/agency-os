import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyClientFilters } from "@/lib/permissions";
import { redirect } from "next/navigation";
import ClientsTable from "./ClientsTable";
import AddClientButton from "./AddClientButton";
import MemberClientsCalendar from "./MemberClientsCalendar";

export default async function ClientsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  // Resolve user permissions
  const permissions = await getPermissions(profile.id);
  const canViewClients = permissions.clients?.view?.allowed || false;
  const canCreateClients = permissions.clients?.create?.allowed || false;
  const clientScope = permissions.clients?.view?.scope || "all";

  if (!canViewClients) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // If standard member, render their client tasks calendar directly
  if (profile.role === "member") {
    const { data: memberTasks } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, due_date, assigned_to, project_id, projects(name, clients(name)), assignee:profiles!tasks_assigned_to_fkey(id, name, role)")
      .eq("assigned_to", profile.id)
      .order("due_date", { ascending: true });

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, name, role")
      .order("name");

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white">My Client Schedule</h1>
          <p className="text-neutral-500 text-sm mt-1">
            View your assigned client tasks and calendar milestones
          </p>
        </div>
        <MemberClientsCalendar
          tasks={(memberTasks ?? []) as any}
          currentProfile={profile as any}
          allProfiles={(allProfiles ?? []) as any}
        />
      </div>
    );
  }

  let query = supabase.from("clients").select("*").order("created_at", { ascending: false });
  query = await applyClientFilters(query, profile.id, clientScope);

  const { data: clients, error } = await query;
  if (error) {
    console.error("Failed to load scoped clients:", error.message);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Clients</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {clients?.length ?? 0} client{clients?.length === 1 ? "" : "s"}
          </p>
        </div>
        {canCreateClients && <AddClientButton />}
      </div>

      <ClientsTable clients={clients ?? []} role={profile.role as any} />
    </div>
  );
}

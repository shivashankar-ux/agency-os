import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions, applyClientFilters } from "@/lib/permissions";
import { redirect } from "next/navigation";
import FilesPageClient from "./FilesPageClient";

export const metadata = {
  title: "Files Vault | Agency OS",
  description: "Central repository for project assets, media files, and client briefs.",
};

export default async function FilesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const permissions = await getPermissions(profile.id);
  const canViewFiles = permissions?.files?.upload?.allowed || permissions?.files?.download?.allowed;
  if (!canViewFiles) redirect("/dashboard");

  const supabase = await createClient();

  // Fetch org_id
  const { data: profileData } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", profile.id)
    .single();

  const orgId = profileData?.org_id;
  if (!orgId) redirect("/dashboard");

  const clientScope = permissions?.clients?.view?.scope ?? "all";

  // Scoped queries in parallel
  let clientsQuery = supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });
  clientsQuery = await applyClientFilters(clientsQuery, profile.id, clientScope);

  const [
    { data: clients },
    { data: files },
    { data: projects },
  ] = await Promise.all([
    clientsQuery,

    supabase
      .from("files")
      .select(`
        *,
        uploader:profiles!files_created_by_fkey(name),
        client:clients!files_client_id_fkey(name),
        project:projects!files_project_id_fkey(name)
      `)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),

    supabase
      .from("projects")
      .select("id, name, client_id")
      .order("name", { ascending: true }),
  ]);

  return (
    <FilesPageClient
      initialFiles={(files ?? []) as any}
      allClients={(clients ?? []) as any}
      allProjects={(projects ?? []) as any}
      permissions={permissions}
      orgId={orgId}
    />
  );
}

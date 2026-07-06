import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import PermissionsToggleList from "./PermissionsToggleList";

export default async function PermissionsPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Fetch all team members except owners
  const { data: team } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "owner")
    .order("created_at", { ascending: true });

  // Fetch existing permissions
  const { data: permissions } = await supabase
    .from("permissions")
    .select("*");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Team Permissions</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Manage view and edit privileges for finance, client management, and team settings.
        </p>
      </div>

      <PermissionsToggleList 
        team={team || []} 
        initialPermissions={permissions || []} 
      />
    </div>
  );
}

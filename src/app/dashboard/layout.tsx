import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import Sidebar from "@/components/Sidebar";
import { PermissionProvider } from "./components/PermissionProvider";
import { getPermissions } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  const permissions = await getPermissions(profile.id);

  return (
    <div className="h-screen bg-neutral-950 flex overflow-hidden">
      <PermissionProvider initialPermissions={permissions} initialRole={profile.role}>
        <Sidebar profile={profile} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </PermissionProvider>
    </div>
  );
}

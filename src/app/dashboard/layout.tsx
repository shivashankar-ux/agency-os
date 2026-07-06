import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import Sidebar from "@/components/Sidebar";
import { PermissionProvider } from "./components/PermissionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      <PermissionProvider>
        <Sidebar profile={profile} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </PermissionProvider>
    </div>
  );
}

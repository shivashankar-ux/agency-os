import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import Link from "next/link";
import InviteMemberModal from "./InviteMemberModal";
import TeamListClient from "./TeamListClient";

export default async function TeamPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner" && profile?.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: team } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Team</h1>
          <p className="text-neutral-500 text-sm mt-0.5">
            {team?.length ?? 0} member{team?.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/team/permissions"
            className="text-xs bg-neutral-850 hover:bg-neutral-800 text-neutral-355 px-3.5 py-2 rounded-lg border border-neutral-700 font-medium transition-colors"
          >
            Manage Permissions
          </Link>
          <InviteMemberModal />
        </div>
      </div>

      <TeamListClient team={team as any[] || []} currentProfile={profile as any} />
    </div>
  );
}

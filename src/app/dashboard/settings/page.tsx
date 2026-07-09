import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | Agency OS",
  description: "Customize your dashboard and manage personal notes/checklists.",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-1">Settings</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Customize your experience and manage personal checklists
      </p>

      <SettingsClient profile={profile as any} />
    </div>
  );
}

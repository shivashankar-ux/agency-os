import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import { getOrgBranding } from "@/app/actions/branding";
import { getDocumentTemplates } from "@/app/actions/document-templates";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings | Agency OS",
  description: "Customize your dashboard, agency branding, and document settings.",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const initialBranding = await getOrgBranding();
  const templates = await getDocumentTemplates();

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-1">Settings</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Customize your experience, agency branding, and document templates
      </p>

      <SettingsClient
        profile={profile as any}
        initialBranding={initialBranding}
        templates={templates}
      />
    </div>
  );
}

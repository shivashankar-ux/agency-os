import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export const metadata = {
  title: "Client Documents | Agency OS",
  description: "Generate branded PDF Welcome Kits, Onboarding Guides, and Invoices.",
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, contact_person, email, contract_type, monthly_retainer_value, gst_number")
    .eq("org_id", profile.org_id)
    .order("name");

  const { data: branding } = await supabase
    .from("org_branding")
    .select("*")
    .eq("org_id", profile.org_id)
    .maybeSingle();

  return (
    <DocumentsClient clients={clients || []} branding={branding} />
  );
}

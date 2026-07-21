"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getOrgBranding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  const { data: branding } = await supabase
    .from("org_branding")
    .select("*")
    .eq("org_id", profile.org_id)
    .maybeSingle();

  return branding;
}

export async function updateOrgBranding(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    return { error: "Only Owners/Admins can update agency branding." };
  }

  const companyName = formData.get("company_name") as string;
  const companyAddress = formData.get("company_address") as string;
  const gstin = formData.get("gstin") as string;
  const primaryColor = (formData.get("primary_color") as string) || "#4f46e5";
  const accentColor = (formData.get("accent_color") as string) || "#06b6d4";
  const logoUrl = formData.get("logo_url") as string;

  const bankName = formData.get("bank_name") as string;
  const accountNumber = formData.get("account_number") as string;
  const ifscCode = formData.get("ifsc_code") as string;
  const accountName = formData.get("account_name") as string;

  const bankDetails = {
    bank_name: bankName || "",
    account_number: accountNumber || "",
    ifsc_code: ifscCode || "",
    account_name: accountName || "",
  };

  const payload = {
    org_id: profile.org_id,
    company_name: companyName || "",
    company_address: companyAddress || "",
    gstin: gstin || "",
    primary_color: primaryColor,
    accent_color: accentColor,
    logo_url: logoUrl || "",
    bank_details: bankDetails,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("org_branding")
    .upsert(payload, { onConflict: "org_id" });

  if (error) {
    console.error("Error updating branding:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createBrandAssetRequest(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  // Insert brand asset submission request row
  const { data, error } = await supabase
    .from("brand_asset_submissions")
    .insert({
      org_id: profile.org_id,
      client_id: clientId,
      status: "pending",
    })
    .select("request_token")
    .single();

  if (error) {
    console.error("Error creating brand asset request:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  return { token: data.request_token };
}

export async function submitBrandAssets(token: string, submittedData: any) {
  const adminSupabase = createAdminClient();

  const { data: submission, error: findErr } = await adminSupabase
    .from("brand_asset_submissions")
    .select("*")
    .eq("request_token", token)
    .single();

  if (findErr || !submission) {
    return { error: "Invalid or expired brand asset collection token." };
  }

  const { error: updateErr } = await adminSupabase
    .from("brand_asset_submissions")
    .update({
      submitted_data: submittedData,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("request_token", token);

  if (updateErr) {
    return { error: updateErr.message };
  }

  return { success: true };
}

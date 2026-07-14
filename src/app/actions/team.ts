"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { revalidatePath } from "next/cache";

export async function updateTeamMember(
  memberId: string, 
  data: { name: string; role: string; job_title: string; is_active: boolean }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== "owner") {
      return { error: "Only owners can update team member roles and status." };
    }

    if (profile.id === memberId) {
      return { error: "You cannot modify your own profile from this panel." };
    }

    const supabase = await createClient();

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        name: data.name,
        role: data.role,
        job_title: data.job_title || null,
        is_active: data.is_active,
      })
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update team member:", error);
      return { error: error.message };
    }

    revalidatePath("/dashboard/team");
    return { success: true, profile: updatedProfile };
  } catch (error: any) {
    console.error("Update team member exception:", error);
    return { error: error.message || "Internal server error" };
  }
}

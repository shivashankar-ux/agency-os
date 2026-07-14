"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "Unauthorized" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const clientId = formData.get("client_id") as string;
    const endDate = formData.get("end_date") as string;

    if (!name || !clientId) {
      return { error: "Name and Client are required" };
    }

    const permissions = await getPermissions(profile.id);
    const canManageProjects = 
      profile.role === "owner" || 
      profile.role === "manager" || 
      permissions.all_clients?.allowed;

    if (!canManageProjects) {
      return { error: "You do not have permission to create projects" };
    }

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name,
        description: description || null,
        client_id: clientId,
        end_date: endDate || null,
        created_by: profile.id,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Project creation failed:", error);
      return { error: error.message };
    }

    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${clientId}`);
    
    return { success: true, project };
  } catch (error: any) {
    console.error("Create project exception:", error);
    return { error: error.message || "Internal server error" };
  }
}

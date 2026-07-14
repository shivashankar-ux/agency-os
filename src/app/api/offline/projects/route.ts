import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getPermissions(profile.id);
    if (!permissions.projects?.create?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const supabase = await createClient();

    if (!data.name) {
      return Response.json({ error: "Project name required" }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: data.name,
        description: data.description,
        owner_id: profile.id,
        status: data.status || "active",
        deadline: data.deadline,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Project create error:", error);
      return Response.json({ error: "Failed to create project" }, { status: 500 });
    }

    // Add owner as project member
    await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: profile.id,
        role: "owner",
      });

    return Response.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Offline project create error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getPermissions(profile.id);
    if (!permissions.projects?.update?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { id, ...updates } = data;
    
    if (!id) {
      return Response.json({ error: "Project ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: project, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("owner_id", profile.id)
      .select()
      .single();

    if (error) {
      console.error("Project update error:", error);
      return Response.json({ error: "Failed to update project" }, { status: 500 });
    }

    return Response.json({ success: true, project });
  } catch (error) {
    console.error("Offline project update error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getPermissions(profile.id);
    if (!permissions.projects?.delete?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ error: "Project ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("owner_id", profile.id);

    if (error) {
      console.error("Project delete error:", error);
      return Response.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Offline project delete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
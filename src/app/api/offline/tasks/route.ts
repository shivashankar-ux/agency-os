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
    if (!permissions.tasks?.create?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const supabase = await createClient();

    // Validate required fields
    if (!data.title || !data.project_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title: data.title,
        description: data.description,
        project_id: data.project_id,
        assignee_id: data.assignee_id || profile.id,
        created_by: profile.id,
        status: data.status || "pending",
        priority: data.priority || "medium",
        due_date: data.due_date,
        tags: data.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Task create error:", error);
      return Response.json({ error: "Failed to create task" }, { status: 500 });
    }

    return Response.json({ success: true, task }, { status: 201 });
  } catch (error) {
    console.error("Offline task create error:", error);
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
    if (!permissions.tasks?.update?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await request.json();
    const { id, ...updates } = data;
    
    if (!id) {
      return Response.json({ error: "Task ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: task, error } = await supabase
      .from("tasks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Task update error:", error);
      return Response.json({ error: "Failed to update task" }, { status: 500 });
    }

    return Response.json({ success: true, task });
  } catch (error) {
    console.error("Offline task update error:", error);
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
    if (!permissions.tasks?.delete?.allowed) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ error: "Task ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Task delete error:", error);
      return Response.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Offline task delete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

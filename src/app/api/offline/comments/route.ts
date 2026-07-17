import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const supabase = await createClient();

    if (!data.task_id || !data.content) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("task_comments")
      .insert({
        task_id: data.task_id,
        user_id: profile.id,
        content: data.content,
        parent_id: data.parent_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Comment create error:", error);
      return Response.json({ error: "Failed to create comment" }, { status: 500 });
    }

    return Response.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error("Offline comment create error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, ...updates } = data;
    
    if (!id) {
      return Response.json({ error: "Comment ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: comment, error } = await supabase
      .from("task_comments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", profile.id) // Only allow editing own comments
      .select()
      .single();

    if (error) {
      console.error("Comment update error:", error);
      return Response.json({ error: "Failed to update comment" }, { status: 500 });
    }

    return Response.json({ success: true, comment });
  } catch (error) {
    console.error("Offline comment update error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ error: "Comment ID required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("task_comments")
      .delete()
      .eq("id", id)
      .eq("user_id", profile.id); // Only allow deleting own comments

    if (error) {
      console.error("Comment delete error:", error);
      return Response.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Offline comment delete error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import webPush from "web-push";

export async function createTask(formData: FormData) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "Unauthorized" };

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const projectId = formData.get("project_id") as string;
    const assignedTo = formData.get("assigned_to") as string;
    const dueDate = formData.get("due_date") as string;
    const priority = formData.get("priority") as string;

    if (!title || !projectId) {
      return { error: "Title and Project are required" };
    }

    const permissions = await getPermissions(profile.id);
    const canManageTasks = 
      profile.role === "owner" || 
      profile.role === "manager" || 
      permissions.all_clients?.allowed;

    if (!canManageTasks) {
      return { error: "You do not have permission to create tasks" };
    }

    const supabase = await createClient();

    // Insert task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description: description || null,
        project_id: projectId,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
        priority: priority || "medium",
        created_by: profile.id,
        status: "todo",
      })
      .select()
      .single();

    if (error) {
      console.error("Task creation failed:", error);
      return { error: error.message };
    }

    // Attempt to send push notification to assignee
    if (assignedTo && assignedTo !== profile.id) {
      try {
        const { data: subscriptions } = await supabase
          .from("push_subscriptions")
          .select("subscription")
          .eq("user_id", assignedTo);

        if (subscriptions && subscriptions.length > 0 && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
          webPush.setVapidDetails(
            "mailto:admin@thestorybuilder.in",
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY!
          );

          const payload = JSON.stringify({
            title: "New Task Assigned",
            body: `You have been assigned to: ${title}`,
            url: "/dashboard/tasks",
            tag: `task-${task.id}`,
            vibrate: [200, 100, 200, 100, 200, 100, 400],
          });

          await Promise.allSettled(
            subscriptions.map(sub => 
              webPush.sendNotification(sub.subscription as any, payload)
            )
          );
        }
      } catch (pushError) {
        console.error("Failed to send push notification:", pushError);
      }
    }

    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/calendar");
    
    return { success: true, task };
  } catch (error: any) {
    console.error("Create task exception:", error);
    return { error: error.message || "Internal server error" };
  }
}

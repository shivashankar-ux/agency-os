import { createClient } from "@/lib/supabase/server";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyTaskDueSoon,
  notifyTaskComment,
  sendNotification
} from "@/lib/realtime/push-notifications";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all active users who have push subscriptions
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return Response.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    const userIds = [...new Set(subscriptions?.map(s => s.user_id) || [])];

    // Subscribe to realtime changes for each user's tasks
    for (const userId of userIds) {
      // Task changes (assignments, updates, completions)
      supabase
        .channel(`tasks:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `assignee_id=eq.${userId}`
          },
          (payload) => {
            handleTaskChange(payload, userId);
          }
        )
        .subscribe();

      // Task comments
      supabase
        .channel(`task_comments:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "task_comments",
            filter: `user_id=eq.${userId}` // mentions
          },
          (payload) => {
            handleTaskComment(payload, userId);
          }
        )
        .subscribe();

      // Project changes
      supabase
        .channel(`projects:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `owner_id=eq.${userId}`
          },
          (payload) => {
            handleProjectChange(payload, userId);
          }
        )
        .subscribe();
    }

    return Response.json({ 
      success: true, 
      subscribedUsers: userIds.length 
    });
  } catch (error) {
    console.error("Realtime start error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleTaskChange(payload: any, userId: string) {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  switch (eventType) {
    case "INSERT":
      // New task assigned
      await notifyTaskAssigned(newRecord.id, newRecord.title, userId, newRecord.project_id || "Project");
      break;

    case "UPDATE":
      if (oldRecord?.assignee_id !== newRecord?.assignee_id) {
        // Reassigned
        if (newRecord.assignee_id === userId) {
          await notifyTaskAssigned(newRecord.id, newRecord.title, userId, newRecord.project_id || "Project");
        }
      }
      if (oldRecord?.status !== newRecord?.status) {
        if (newRecord.status === "completed") {
          await notifyTaskCompleted(newRecord.id, newRecord.title, newRecord.updated_by || newRecord.assignee_id, userId, newRecord.project_id || "Project");
        }
      }
      if (oldRecord?.due_date !== newRecord?.due_date) {
        // Due date changed - check if due soon
        if (newRecord.due_date) {
          const hoursUntilDue = Math.ceil(
            (new Date(newRecord.due_date).getTime() - Date.now()) / (1000 * 60 * 60)
          );
          if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
            await notifyTaskDueSoon(newRecord.id, newRecord.title, userId, newRecord.project_id || "Project", hoursUntilDue);
          }
        }
      }
      break;

    case "DELETE":
      // Task deleted - notify if it was assigned
      if (oldRecord?.assignee_id === userId) {
        await sendNotification(userId, {
          title: "Task Removed",
          body: `"${oldRecord.title}" was deleted`,
          tag: `task_deleted_${oldRecord.id}`,
          url: "/dashboard/tasks"
        });
      }
      break;
  }
}

async function handleTaskComment(payload: any, userId: string) {
  const { new: comment } = payload;
  
  // Check if user was mentioned
  if (comment.content?.includes(`@${userId}`) || comment.mentions?.includes(userId)) {
    await sendNotification(userId, {
      title: "You were mentioned",
      body: `In task comment: ${comment.content?.slice(0, 100)}`,
      tag: `mention_${comment.id}`,
      url: `/dashboard/tasks/${comment.task_id}`
    });
  }
}

async function handleProjectChange(payload: any, userId: string) {
  const { eventType, new: newRecord } = payload;

  if (eventType === "UPDATE" && newRecord?.deadline) {
    // Check if deadline is approaching
    const hoursUntilDeadline = Math.ceil(
      (new Date(newRecord.deadline).getTime() - Date.now()) / (1000 * 60 * 60)
    );
    if (hoursUntilDeadline > 0 && hoursUntilDeadline <= 48) {
      await sendNotification(userId, {
        title: "Project Deadline Approaching",
        body: `"${newRecord.name}" deadline in ${hoursUntilDeadline}h`,
        tag: `project_deadline_${newRecord.id}`,
        url: `/dashboard/projects/${newRecord.id}`
      });
    }
  }
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  notifyTaskAssigned,
  notifyTaskCompleted,
  notifyTaskOverdue,
  notifyTaskDueSoon,
  notifyTaskComment
} from "./push-notifications";

let channels: Map<string, RealtimeChannel> = new Map();

export async function startRealtimeListeners(): Promise<void> {
  if (channels.size > 0) {
    console.log("Realtime listeners already running");
    return;
  }

  const supabase = await createClient();

  // Tasks table changes
  const tasksChannel = supabase
    .channel("tasks-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks"
      },
      async (payload) => {
        await handleTaskChange(payload);
      }
    )
    .subscribe();

  // Task comments changes
  const commentsChannel = supabase
    .channel("task-comments-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "task_comments"
      },
      async (payload) => {
        await handleCommentInsert(payload);
      }
    )
    .subscribe();

  // Task mentions (via comments with @mentions)
  const mentionsChannel = supabase
    .channel("task-mentions-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "task_mentions"
      },
      async (payload) => {
        await handleMentionInsert(payload);
      }
    )
    .subscribe();

  channels.set("tasks", tasksChannel);
  channels.set("comments", commentsChannel);
  channels.set("mentions", mentionsChannel);

  console.log("Realtime listeners started");
}

export async function stopRealtimeListeners(): Promise<void> {
  const supabase = await createClient();
  for (const [name, channel] of channels) {
    await supabase.removeChannel(channel);
    console.log(`Stopped channel: ${name}`);
  }
  channels.clear();
}

async function handleTaskChange(payload: any): Promise<void> {
  const { eventType, new: newRecord, old: oldRecord } = payload;

  switch (eventType) {
    case "INSERT":
      if (newRecord.assignee_id) {
        await notifyTaskAssigned(
          newRecord.id,
          newRecord.title,
          newRecord.assignee_id,
          newRecord.project_id || "Project"
        );
      }
      break;

    case "UPDATE":
      // Task assigned
      if (oldRecord.assignee_id !== newRecord.assignee_id && newRecord.assignee_id) {
        await notifyTaskAssigned(
          newRecord.id,
          newRecord.title,
          newRecord.assignee_id,
          newRecord.project_id || "Project"
        );
      }

      // Task completed
      if (oldRecord.status !== "completed" && newRecord.status === "completed") {
        await notifyTaskCompleted(
          newRecord.id,
          newRecord.title,
          newRecord.updated_by || newRecord.assignee_id,
          newRecord.assignee_id,
          newRecord.project_id || "Project"
        );
      }

      // Task overdue (status changed to overdue)
      if (oldRecord.status !== "overdue" && newRecord.status === "overdue") {
        await notifyTaskOverdue(
          newRecord.id,
          newRecord.title,
          newRecord.assignee_id,
          newRecord.project_id || "Project"
        );
      }
      break;

    case "DELETE":
      // Optional: notify if task deleted
      break;
  }
}

async function handleCommentInsert(payload: any): Promise<void> {
  const comment = payload.new;
  if (!comment.task_id || !comment.user_id) return;

  // Get task details
  const supabase = await createClient();
  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, project_id, assignee_id")
    .eq("id", comment.task_id)
    .single();

  if (!task) return;

  // Get commenter name
  const { data: commenter } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", comment.user_id)
    .single();

  // Extract mentions from comment content
  const mentionRegex = /@(\w+)/g;
  const mentions = [...comment.content.matchAll(mentionRegex)].map(m => m[1]);
  const mentionedUserIds: string[] = [];

  if (mentions.length > 0) {
    const { data: mentionedUsers } = await supabase
      .from("profiles")
      .select("id")
      .in("username", mentions);
    mentionedUserIds.push(...(mentionedUsers?.map(u => u.id) || []));
  }

  await notifyTaskComment(
    task.id,
    task.title,
    comment.user_id,
    commenter?.name || "Someone",
    task.project_id,
    mentionedUserIds
  );
}

async function handleMentionInsert(payload: any): Promise<void> {
  const mention = payload.new;
  if (!mention.task_id || !mention.user_id || !mention.mentioned_user_id) return;

  // Get task and mentioner details
  const supabase = await createClient();
  const [{ data: task }, { data: mentioner }] = await Promise.all([
    supabase.from("tasks").select("id, title, project_id").eq("id", mention.task_id).single(),
    supabase.from("profiles").select("name").eq("id", mention.user_id).single()
  ]);

  if (!task) return;

  await notifyTaskComment(
    task.id,
    task.title,
    mention.user_id,
    mentioner?.name || "Someone",
    task.project_id,
    [mention.mentioned_user_id]
  );
}

// Scheduled job to check for due soon/overdue tasks
export async function checkTaskDeadlines(): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find tasks due in 24 hours (not completed, not overdue)
  const { data: dueSoonTasks } = await supabase
    .from("tasks")
    .select("id, title, assignee_id, project_id, due_date")
    .eq("status", "pending")
    .lte("due_date", in24Hours.toISOString())
    .gt("due_date", now.toISOString());

  for (const task of dueSoonTasks || []) {
    if (task.assignee_id) {
      const hoursUntilDue = Math.ceil(
        (new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60)
      );
      await notifyTaskDueSoon(
        task.id,
        task.title,
        task.assignee_id,
        task.project_id || "Project",
        hoursUntilDue
      );
    }
  }

  // Find overdue tasks (not yet marked overdue)
  const { data: overdueTasks } = await supabase
    .from("tasks")
    .select("id, title, assignee_id, project_id, due_date")
    .eq("status", "pending")
    .lt("due_date", now.toISOString());

  for (const task of overdueTasks || []) {
    if (task.assignee_id) {
      // Update status to overdue
      await supabase
        .from("tasks")
        .update({ status: "overdue" })
        .eq("id", task.id);

      await notifyTaskOverdue(
        task.id,
        task.title,
        task.assignee_id,
        task.project_id || "Project"
      );
    }
  }
}

// Run daily digest
export async function sendDailyDigests(): Promise<void> {
  const supabase = await createClient();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Get all active users with subscriptions
  const { data: users } = await supabase
    .from("push_subscriptions")
    .select("user_id");

  if (!users) return;

  for (const { user_id } of users) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("id, title, project_id, due_date, status")
      .eq("assignee_id", user_id)
      .in("status", ["pending", "overdue", "in_progress"])
      .lte("due_date", tomorrow.toISOString())
      .order("due_date", { ascending: true });

    const taskSummary = (tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      project: t.project_id,
      dueDate: t.due_date,
      status: t.due_date && new Date(t.due_date) < now ? "overdue"
        : t.due_date && new Date(t.due_date).toDateString() === now.toDateString() ? "due_today"
        : "due_soon"
    }));

    await import("./push-notifications").then(m => m.sendDailyDigest(user_id, taskSummary));
  }
}

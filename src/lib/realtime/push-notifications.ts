"use server";

import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: Record<string, unknown>;
}

async function sendPushNotification(
  subscription: webPush.PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  // Set VAPID details here (inside handler) to avoid build-time env var errors
  webPush.setVapidDetails(
    "mailto:admin@thestorybuilder.in",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/icon-96x96.png",
      vibrate: payload.vibrate || [200, 100, 200, 100, 200, 100, 400],
      tag: payload.tag || `notification-${Date.now()}`,
      requireInteraction: payload.requireInteraction ?? true,
      actions: payload.actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" }
      ],
      data: {
        url: payload.url || "/dashboard",
        ...payload.data
      }
    });

    await webPush.sendNotification(subscription, pushPayload);
    return true;
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired, will be cleaned up
    }
    console.error("Push notification failed:", error);
    return false;
  }
}

async function getSubscriptionsForUsers(userIds: string[]): Promise<
  Array<{ user_id: string; subscription: webPush.PushSubscription }>
> {
  if (userIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("user_id, subscription")
    .in("user_id", userIds);

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }

  return data || [];
}

async function shouldNotifyUser(
  userId: string,
  notificationType: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("enabled")
    .eq("user_id", userId)
    .eq("type", notificationType)
    .single();

  if (error || !data) {
    // Default to true for critical types
    return ["task_assigned", "task_overdue", "task_due_soon"].includes(notificationType);
  }
  return data.enabled;
}

export async function notifyTaskAssigned(
  taskId: string,
  taskTitle: string,
  assigneeId: string,
  projectName: string
) {
  const shouldNotify = await shouldNotifyUser(assigneeId, "task_assigned");
  if (!shouldNotify) return;

  const subs = await getSubscriptionsForUsers([assigneeId]);
  const payload: NotificationPayload = {
    title: "🚨 New Task Assigned",
    body: `"${taskTitle}" in ${projectName}`,
    tag: `task-assigned-${taskId}`,
    url: `/dashboard/tasks/${taskId}`,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    data: { type: "task_assigned", taskId }
  };

  await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
}

export async function notifyTaskCompleted(
  taskId: string,
  taskTitle: string,
  completedBy: string,
  assigneeId: string,
  projectName: string
) {
  const userIds = [completedBy, assigneeId].filter(Boolean);
  const payload: NotificationPayload = {
    title: "✅ Task Completed",
    body: `"${taskTitle}" marked complete in ${projectName}`,
    tag: `task-completed-${taskId}`,
    url: `/dashboard/tasks/${taskId}`,
    data: { type: "task_completed", taskId }
  };

  for (const userId of userIds) {
    const shouldNotify = await shouldNotifyUser(userId, "task_completed");
    if (!shouldNotify) continue;

    const subs = await getSubscriptionsForUsers([userId]);
    await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
  }
}

export async function notifyTaskOverdue(
  taskId: string,
  taskTitle: string,
  assigneeId: string,
  projectName: string
) {
  const shouldNotify = await shouldNotifyUser(assigneeId, "task_overdue");
  if (!shouldNotify) return;

  const subs = await getSubscriptionsForUsers([assigneeId]);
  const payload: NotificationPayload = {
    title: "⚠️ Task Overdue",
    body: `"${taskTitle}" was due yesterday in ${projectName}`,
    tag: `task-overdue-${taskId}`,
    url: `/dashboard/tasks/${taskId}`,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    data: { type: "task_overdue", taskId }
  };

  await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
}

export async function notifyTaskDueSoon(
  taskId: string,
  taskTitle: string,
  assigneeId: string,
  projectName: string,
  hoursUntilDue: number
) {
  const shouldNotify = await shouldNotifyUser(assigneeId, "task_due_soon");
  if (!shouldNotify) return;

  const subs = await getSubscriptionsForUsers([assigneeId]);
  const payload: NotificationPayload = {
    title: "⏰ Task Due Soon",
    body: `"${taskTitle}" due in ${hoursUntilDue}h in ${projectName}`,
    tag: `task-due-soon-${taskId}`,
    url: `/dashboard/tasks/${taskId}`,
    data: { type: "task_due_soon", taskId }
  };

  await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
}

export async function notifyTaskComment(
  taskId: string,
  taskTitle: string,
  commenterId: string,
  commenterName: string,
  projectId: string,
  mentionedUserIds: string[] = []
) {
  const supabase = await createClient();

  // Get project members
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  const memberIds = members?.map(m => m.user_id).filter(id => id !== commenterId) || [];
  const notifyIds = [...new Set([...memberIds, ...mentionedUserIds])];

  for (const userId of notifyIds) {
    const shouldNotify = mentionedUserIds.includes(userId)
      ? await shouldNotifyUser(userId, "task_mentioned")
      : await shouldNotifyUser(userId, "task_comment");

    if (!shouldNotify) continue;

    const subs = await getSubscriptionsForUsers([userId]);
    const isMention = mentionedUserIds.includes(userId);

    const payload: NotificationPayload = {
      title: isMention ? "📣 You were mentioned" : "💬 New Comment",
      body: `${commenterName} commented on "${taskTitle}"`,
      tag: `task-comment-${taskId}-${Date.now()}`,
      url: `/dashboard/tasks/${taskId}#comments`,
      data: { type: isMention ? "task_mentioned" : "task_comment", taskId }
    };

    await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
  }
}

// Batch notification for daily digest
export async function sendDailyDigest(userId: string, tasks: Array<{
  id: string;
  title: string;
  project: string;
  dueDate: string;
  status: string;
}>) {
  if (tasks.length === 0) return;

  const shouldNotify = await shouldNotifyUser(userId, "daily_digest");
  if (!shouldNotify) return;

  const subs = await getSubscriptionsForUsers([userId]);
  const overdue = tasks.filter(t => t.status === "overdue").length;
  const dueToday = tasks.filter(t => t.status === "due_today").length;
  const dueSoon = tasks.filter(t => t.status === "due_soon").length;

  const payload: NotificationPayload = {
    title: "📋 Daily Task Summary",
    body: `${overdue} overdue · ${dueToday} due today · ${dueSoon} due soon`,
    tag: `daily-digest-${new Date().toISOString().split("T")[0]}`,
    url: "/dashboard/tasks",
    data: { type: "daily_digest", tasks: tasks.slice(0, 5) }
  };

  await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
}

export async function sendNotification(userId: string, payload: NotificationPayload) {
  const subs = await getSubscriptionsForUsers([userId]);
  await Promise.all(subs.map(s => sendPushNotification(s.subscription, payload)));
}

import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

webPush.setVapidDetails(
  "mailto:admin@thestorybuilder.in",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, subscription");

    if (subError || !subscriptions?.length) {
      return Response.json({ success: true, checked: 0 });
    }

    let dueSoonCount = 0;
    let overdueCount = 0;

    for (const { user_id, subscription } of subscriptions) {
      // Check notification preferences
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user_id)
        .single();

      const taskDueSoon = prefs?.task_due_soon !== false;
      const taskOverdue = prefs?.task_overdue !== false;
      const sirenEnabled = prefs?.siren_enabled !== false;

      if (!taskDueSoon && !taskOverdue) continue;

      // Find due soon tasks
      if (taskDueSoon) {
        const { data: dueSoonTasks } = await supabase
          .from("tasks")
          .select("id, title, project_id, due_date")
          .eq("assignee_id", user_id)
          .eq("status", "pending")
          .lte("due_date", in24Hours.toISOString())
          .gt("due_date", now.toISOString())
          .order("due_date", { ascending: true })
          .limit(5);

        for (const task of dueSoonTasks || []) {
          const hoursUntilDue = Math.ceil(
            (new Date(task.due_date).getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          await sendNotification(subscription, {
            title: `Due in ${hoursUntilDue}h`,
            body: task.title,
            tag: `due_soon_${task.id}`,
            url: `/dashboard/tasks/${task.id}`,
            data: { taskId: task.id, type: "due_soon", hoursUntilDue },
            siren: sirenEnabled
          });
          dueSoonCount++;
        }
      }

      // Find overdue tasks
      if (taskOverdue) {
        const { data: overdueTasks } = await supabase
          .from("tasks")
          .select("id, title, project_id, due_date")
          .eq("assignee_id", user_id)
          .eq("status", "pending")
          .lt("due_date", now.toISOString())
          .order("due_date", { ascending: true })
          .limit(5);

        for (const task of overdueTasks || []) {
          // Update task status to overdue
          await supabase
            .from("tasks")
            .update({ status: "overdue" })
            .eq("id", task.id);

          await sendNotification(subscription, {
            title: "Task Overdue",
            body: task.title,
            tag: `overdue_${task.id}`,
            url: `/dashboard/tasks/${task.id}`,
            data: { taskId: task.id, type: "overdue" },
            siren: sirenEnabled
          });
          overdueCount++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      dueSoonNotified: dueSoonCount,
      overdueNotified: overdueCount
    });
  } catch (error) {
    console.error("Cron check-deadlines error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendNotification(subscription: any, payload: any) {
  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: payload.siren ? [500, 200, 500, 200, 500, 200, 1000] : [200, 100, 200, 100, 200, 100, 400],
    tag: payload.tag,
    requireInteraction: true,
    actions: [
      { action: "view", title: "View" },
      { action: "dismiss", title: "Dismiss" }
    ],
    data: { url: payload.url, ...payload.data }
  });

  try {
    await webPush.sendNotification(subscription, notificationPayload);
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription expired - remove it
      const supabase = await createClient();
      await supabase.from("push_subscriptions").delete().eq("subscription", subscription);
    }
    console.error("Push send failed:", error);
  }
}
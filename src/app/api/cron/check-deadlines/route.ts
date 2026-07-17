import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

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

    const userIds = subscriptions.map((s) => s.user_id);

    // Batch fetch notification preferences
    const { data: prefsData } = await supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", userIds);
    
    const prefsMap = new Map(prefsData?.map(p => [p.user_id, p]) || []);

    // Batch fetch due soon tasks
    const { data: dueSoonTasksData } = await supabase
      .from("tasks")
      .select("id, title, project_id, due_date, assignee_id")
      .in("assignee_id", userIds)
      .eq("status", "pending")
      .lte("due_date", in24Hours.toISOString())
      .gt("due_date", now.toISOString())
      .order("due_date", { ascending: true });

    // Batch fetch overdue tasks
    const { data: overdueTasksData } = await supabase
      .from("tasks")
      .select("id, title, project_id, due_date, assignee_id")
      .in("assignee_id", userIds)
      .eq("status", "pending")
      .lt("due_date", now.toISOString())
      .order("due_date", { ascending: true });

    const dueSoonByAssignee = groupBy(dueSoonTasksData || [], "assignee_id");
    const overdueByAssignee = groupBy(overdueTasksData || [], "assignee_id");

    let dueSoonCount = 0;
    let overdueCount = 0;

    for (const { user_id, subscription } of subscriptions) {
      const prefs = prefsMap.get(user_id);
      const taskDueSoon = prefs?.task_due_soon !== false;
      const taskOverdue = prefs?.task_overdue !== false;
      const sirenEnabled = prefs?.siren_enabled !== false;

      if (!taskDueSoon && !taskOverdue) continue;

      if (taskDueSoon) {
        const tasks = dueSoonByAssignee[user_id] || [];
        for (const task of tasks.slice(0, 5)) {
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

      if (taskOverdue) {
        const tasks = overdueByAssignee[user_id] || [];
        for (const task of tasks.slice(0, 5)) {
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

function groupBy(array: any[], key: string) {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
}

async function sendNotification(subscription: any, payload: any) {
  webPush.setVapidDetails(
    "mailto:admin@thestorybuilder.in",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

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
      const supabase = await createClient();
      await supabase.from("push_subscriptions").delete().eq("subscription", subscription);
    }
    console.error("Push send failed:", error);
  }
}

import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id, subscription");

    if (subError || !subscriptions?.length) {
      return Response.json({ success: true, sent: 0 });
    }

    const userIds = subscriptions.map((s) => s.user_id);

    // Batch fetch pending tasks
    const { data: pendingTasksData } = await supabase
      .from("tasks")
      .select("id, title, project_id, due_date, status, completed_at, assignee_id")
      .in("assignee_id", userIds)
      .in("status", ["pending", "overdue", "in_progress"])
      .lte("due_date", tomorrow.toISOString())
      .order("due_date", { ascending: true });

    // Batch fetch completed tasks
    const { data: completedTasksData } = await supabase
      .from("tasks")
      .select("id, assignee_id")
      .in("assignee_id", userIds)
      .eq("status", "completed")
      .gte("completed_at", weekStart.toISOString());

    const pendingByAssignee = groupBy(pendingTasksData || [], "assignee_id");
    const completedByAssignee = groupBy(completedTasksData || [], "assignee_id");

    let sentCount = 0;

    for (const { user_id, subscription } of subscriptions) {
      const pendingTasks = pendingByAssignee[user_id] || [];
      const completedThisWeek = completedByAssignee[user_id] || [];

      const hasTasks = pendingTasks.length > 0 || completedThisWeek.length > 0;
      if (!hasTasks) continue;

      const overdueCount = pendingTasks.filter((t: any) => new Date(t.due_date) < now).length;
      const dueTodayCount = pendingTasks.filter((t: any) => 
        t.due_date && new Date(t.due_date).toDateString() === now.toDateString()
      ).length;
      const dueSoonCount = pendingTasks.length - overdueCount - dueTodayCount;
      const completedCount = completedThisWeek.length;

      const body = [
        overdueCount > 0 && `${overdueCount} overdue`,
        dueTodayCount > 0 && `${dueTodayCount} due today`,
        dueSoonCount > 0 && `${dueSoonCount} due soon`,
        completedCount > 0 && `✓ ${completedCount} completed this week`
      ].filter(Boolean).join(" · ");

      await sendNotification(subscription, {
        title: "📅 Your Daily Summary",
        body: body || "No urgent tasks",
        tag: `daily_digest_${user_id}_${now.toDateString()}`,
        url: "/dashboard",
        data: { type: "daily_digest", date: now.toISOString() },
        siren: false
      });
      sentCount++;
    }

    return Response.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error("Cron daily-digest error:", error);
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
    vibrate: payload.siren ? [500, 200, 500, 200, 500, 200, 1000] : [100, 50, 100],
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

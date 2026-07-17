import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import webPush from "web-push";

export async function POST(request: Request) {
  // Set VAPID details here (inside handler) to avoid build-time env var errors
  webPush.setVapidDetails(
    "mailto:admin@thestorybuilder.in",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await getPermissions(profile.id);
    const canSendNotifications = permissions.notifications?.send?.allowed || false;
    
    if (!canSendNotifications && profile.role !== "owner" && profile.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userIds, title, body, data, actions, tag } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return Response.json({ error: "User IDs required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("user_id, subscription")
      .in("user_id", userIds);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return Response.json({ error: "Failed to fetch subscriptions" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ success: true, sent: 0, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({
      title: title || "Agency OS",
      body: body || "You have a new notification",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      vibrate: [200, 100, 200, 100, 200, 100, 400],
      tag: tag || `notification-${Date.now()}`,
      requireInteraction: true,
      actions: actions || [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" }
      ],
      data: data || {},
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            sub.subscription as webPush.PushSubscription,
            payload
          );
          return { userId: sub.user_id, success: true };
        } catch (error: any) {
          if (error.statusCode === 410 || error.statusCode === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("user_id", sub.user_id);
          }
          return { userId: sub.user_id, success: false, error: error.message };
        }
      })
    );

    const sent = results.filter(r => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - sent;

    return Response.json({ 
      success: true, 
      sent, 
      failed,
      results: results.map(r => r.status === "fulfilled" ? r.value : { success: false, error: r.reason })
    });
  } catch (error) {
    console.error("Push send error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

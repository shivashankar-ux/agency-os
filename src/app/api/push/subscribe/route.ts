import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
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

    const { subscription } = await request.json();
    if (!subscription) {
      return Response.json({ error: "Subscription required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: profile.id,
        subscription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      console.error("Error saving subscription:", error);
      return Response.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
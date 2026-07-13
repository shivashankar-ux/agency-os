import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", profile.id);

    if (error) {
      console.error("Error removing subscription:", error);
      return Response.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
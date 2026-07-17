import { createClient } from "@supabase/supabase-js";

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number,
  windowHours: number
): Promise<{ allowed: boolean; remaining: number }> {
  // Use admin client since RLS might block normal users from reading/writing rate_limits
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - windowStart.getHours() % windowHours, 0, 0, 0);

  const windowStartIso = windowStart.toISOString();

  // Try to find existing record
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("id, count")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .eq("window_start", windowStartIso)
    .single();

  if (existing) {
    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }
    
    // Increment
    await supabase
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("id", existing.id);
      
    return { allowed: true, remaining: limit - (existing.count + 1) };
  } else {
    // Create new
    await supabase.from("rate_limits").insert({
      user_id: userId,
      endpoint,
      window_start: windowStartIso,
      count: 1
    });
    
    return { allowed: true, remaining: limit - 1 };
  }
}

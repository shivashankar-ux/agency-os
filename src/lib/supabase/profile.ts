import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "member" | "client";
  job_title: string | null;
  avatar_url: string | null;
  is_active: boolean;
  client_id?: string | null;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

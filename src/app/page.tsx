import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function Home() {
  const profile = await getCurrentProfile();
  redirect(profile && profile.is_active ? "/dashboard" : "/login");
}

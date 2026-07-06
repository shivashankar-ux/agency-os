import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";
import FinancePageClient from "./FinancePageClient";

export default async function FinancePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  // Gated by Permissions Engine
  const permissions = await getPermissions(profile.id);
  if (!permissions.finance?.view?.allowed) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Load clients and invoices in parallel for optimal database response times
  const [invoicesRes, clientsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .order("issue_date", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .order("name", { ascending: true }),
  ]);

  if (invoicesRes.error) {
    throw new Error(`Failed to load invoice history: ${invoicesRes.error.message}`);
  }

  const invoices = invoicesRes.data || [];
  const clients = clientsRes.data || [];

  return (
    <FinancePageClient 
      initialInvoices={invoices as any[]} 
      clients={clients} 
    />
  );
}

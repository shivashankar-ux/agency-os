import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "owner") redirect("/dashboard");

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .order("issue_date", { ascending: false });

  const totalRevenue = (invoices ?? [])
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount ?? 0), 0);

  const pending = (invoices ?? [])
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + Number(i.total_amount ?? 0), 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-white mb-1">Finance</h1>
      <p className="text-neutral-500 text-sm mb-6">Revenue, invoices, and profitability</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-neutral-500 text-xs font-medium">Revenue (Paid)</p>
          <p className="text-white text-2xl font-semibold mt-2">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-neutral-500 text-xs font-medium">Pending</p>
          <p className="text-white text-2xl font-semibold mt-2">
            ₹{pending.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {(!invoices || invoices.length === 0) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
          <p className="text-neutral-500 text-sm">No invoices yet.</p>
        </div>
      )}
    </div>
  );
}

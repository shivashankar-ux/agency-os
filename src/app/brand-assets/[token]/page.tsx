import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import BrandAssetsClient from "./BrandAssetsClient";

export default async function BrandAssetsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const adminSupabase = createAdminClient();

  const { data: submission, error } = await adminSupabase
    .from("brand_asset_submissions")
    .select(`
      id, status, request_token,
      clients ( name ),
      organizations ( name )
    `)
    .eq("request_token", token)
    .maybeSingle();

  if (error || !submission) {
    notFound();
  }

  const clientName = (submission.clients as any)?.name || "Valued Client";
  const agencyName = (submission.organizations as any)?.name || "Our Agency";

  return (
    <BrandAssetsClient
      token={token}
      clientName={clientName}
      agencyName={agencyName}
    />
  );
}

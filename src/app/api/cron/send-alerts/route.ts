import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ error: "Email service is not configured" }, { status: 500 });

  const supabase = createAdminClient();
  const { data: alerts, error } = await supabase
    .from("email_alerts")
    .select("id, subject, message, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email)")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  let sent = 0;
  let failed = 0;

  for (const alert of alerts || []) {
    const recipient = Array.isArray(alert.recipient) ? alert.recipient[0] : alert.recipient;
    if (!recipient?.email) {
      await supabase.from("email_alerts").update({ status: "failed", error_message: "Recipient email is missing" }).eq("id", alert.id).eq("status", "scheduled");
      failed++;
      continue;
    }

    const { error: sendError } = await resend.emails.send({
      from: `Agency OS <${fromEmail}>`,
      to: recipient.email,
      subject: alert.subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#334155;line-height:1.6"><p>Hello ${escapeHtml(recipient.name || "there")},</p><p>${escapeHtml(alert.message).replaceAll("\n", "<br />")}</p><p style="color:#94a3b8;font-size:12px">Sent from Agency OS.</p></div>`,
    });

    await supabase.from("email_alerts").update(sendError ? { status: "failed", error_message: sendError.message } : { status: "sent", sent_at: new Date().toISOString() }).eq("id", alert.id).eq("status", "scheduled");
    sendError ? failed++ : sent++;
  }

  return Response.json({ success: true, sent, failed });
}
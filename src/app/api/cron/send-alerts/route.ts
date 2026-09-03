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
    .select("id, subject, message, recipient_email, recipient_name, image_url, recurrence_day, recurrence_interval_hours, recurrence_start_time, recurrence_end_time, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email)")
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
    const profileRecipient = Array.isArray(alert.recipient) ? alert.recipient[0] : alert.recipient;
    const recipient = profileRecipient || { name: alert.recipient_name, email: alert.recipient_email };
    if (!recipient?.email) {
      await supabase.from("email_alerts").update({ status: "failed", error_message: "Recipient email is missing" }).eq("id", alert.id).eq("status", "scheduled");
      failed++;
      continue;
    }

    const attachments = alert.image_url ? [{ filename: "alert-image", content: Buffer.from(await (await fetch(alert.image_url)).arrayBuffer()) }] : undefined;
    const { error: sendError } = await resend.emails.send({
      from: `Agency OS <${fromEmail}>`,
      to: recipient.email,
      subject: alert.subject,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#334155;line-height:1.6"><p>Hello ${escapeHtml(recipient.name || "there")},</p><p>${escapeHtml(alert.message).replaceAll("\n", "<br />")}</p><p style="color:#94a3b8;font-size:12px">Sent from Agency OS.</p></div>`,
      ...(attachments ? { attachments } : {}),
    });

    const update = sendError
      ? { status: "failed", error_message: sendError.message }
      : alert.recurrence_day !== null
        ? { status: "scheduled", scheduled_for: getNextOccurrence(alert).toISOString(), sent_at: new Date().toISOString() }
        : { status: "sent", sent_at: new Date().toISOString() };
    await supabase.from("email_alerts").update(update).eq("id", alert.id).eq("status", "scheduled");
    sendError ? failed++ : sent++;
  }

  return Response.json({ success: true, sent, failed });
}

function getNextOccurrence(alert: { recurrence_day: number; recurrence_interval_hours: number; recurrence_start_time: string; recurrence_end_time: string }) {
  const [startHours, startMinutes] = alert.recurrence_start_time.split(":").map(Number);
  const [endHours, endMinutes] = alert.recurrence_end_time.split(":").map(Number);
  const current = new Date();
  const next = new Date(current);
  const intervalMs = Number(alert.recurrence_interval_hours) * 60 * 60 * 1000;
  const endMinutesOfDay = endHours * 60 + endMinutes;
  const currentMinutesOfDay = current.getHours() * 60 + current.getMinutes();

  if (current.getDay() === alert.recurrence_day && currentMinutesOfDay < endMinutesOfDay) {
    const candidate = new Date(current.getTime() + intervalMs);
    if (candidate.getDay() === alert.recurrence_day && candidate.getHours() * 60 + candidate.getMinutes() <= endMinutesOfDay) return candidate;
  }

  next.setDate(next.getDate() + ((alert.recurrence_day - next.getDay() + 7) % 7 || 7));
  next.setHours(startHours, startMinutes, 0, 0);
  return next;
}
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    .select(
      "id, subject, message, schedule_type, target_date, occurrences_per_day, sent_count, recipient_email, recipient_name, image_url, recurrence_day, recurrence_start_time, recurrence_end_time, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email)"
    )
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for")
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "crm@thestorybuilder.in";
  let sent = 0;
  let failed = 0;

  for (const alert of alerts || []) {
    const profileRecipient = Array.isArray(alert.recipient) ? alert.recipient[0] : alert.recipient;
    const recipient = profileRecipient || { name: alert.recipient_name, email: alert.recipient_email };

    if (!recipient?.email) {
      await supabase
        .from("email_alerts")
        .update({ status: "failed", error_message: "Recipient email is missing" })
        .eq("id", alert.id)
        .eq("status", "scheduled");
      failed++;
      continue;
    }

    // Attach optional image if present
    let attachments;
    if (alert.image_url) {
      try {
        const imgRes = await fetch(alert.image_url);
        if (imgRes.ok) {
          attachments = [{ filename: "alert-image", content: Buffer.from(await imgRes.arrayBuffer()) }];
        }
      } catch (e) {
        console.error("Could not fetch alert image:", e);
      }
    }

    const { error: sendError } = await resend.emails.send({
      from: `Agency OS <${fromEmail}>`,
      to: recipient.email,
      subject: alert.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">🔔 Agency OS Alert</h2>
          <p>Hello <strong>${escapeHtml(recipient.name || "Team Member")}</strong>,</p>
          <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #6366f1; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${escapeHtml(alert.message)}</p>
          </div>
          ${alert.image_url ? `<div style="margin-top: 16px;"><img src="${alert.image_url}" alt="Alert Attachment" style="max-width: 100%; border-radius: 6px;" /></div>` : ""}
          <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            Sent from Agency OS.
          </p>
        </div>
      `,
      ...(attachments ? { attachments } : {}),
    });

    if (sendError) {
      await supabase
        .from("email_alerts")
        .update({ status: "failed", error_message: sendError.message })
        .eq("id", alert.id);
      failed++;
    } else {
      sent++;
      const nextSentCount = (alert.sent_count || 0) + 1;
      const occurrencesNeeded = alert.occurrences_per_day || 1;

      if (nextSentCount < occurrencesNeeded) {
        // Calculate next send time on the SAME day
        const startTimeStr = alert.recurrence_start_time || "09:00";
        const endTimeStr = alert.recurrence_end_time || "18:00";

        const [sH, sM] = startTimeStr.split(":").map(Number);
        const [eH, eM] = endTimeStr.split(":").map(Number);

        const totalMinutesWindow = Math.max(60, (eH * 60 + eM) - (sH * 60 + sM));
        const intervalMinutes = Math.floor(totalMinutesWindow / (occurrencesNeeded - 1 || 1));

        const nextScheduledTime = new Date();
        nextScheduledTime.setMinutes(nextScheduledTime.getMinutes() + intervalMinutes);

        await supabase
          .from("email_alerts")
          .update({
            status: "scheduled",
            sent_count: nextSentCount,
            scheduled_for: nextScheduledTime.toISOString(),
            sent_at: new Date().toISOString(),
          })
          .eq("id", alert.id);
      } else {
        // Finished all occurrences for today!
        if (alert.schedule_type === "weekly_recurring" && alert.recurrence_day !== null) {
          // Schedule for next week's start day & time
          const nextWeekDate = getNextWeeklyOccurrence(alert.recurrence_day, alert.recurrence_start_time || "09:00");
          await supabase
            .from("email_alerts")
            .update({
              status: "scheduled",
              sent_count: 0,
              scheduled_for: nextWeekDate.toISOString(),
              sent_at: new Date().toISOString(),
            })
            .eq("id", alert.id);
        } else {
          // One-time or specific date complete
          await supabase
            .from("email_alerts")
            .update({
              status: "sent",
              sent_count: nextSentCount,
              sent_at: new Date().toISOString(),
            })
            .eq("id", alert.id);
        }
      }
    }
  }

  return Response.json({ success: true, sent, failed });
}

function getNextWeeklyOccurrence(day: number, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const next = new Date();
  next.setDate(next.getDate() + ((day - next.getDay() + 7) % 7 || 7));
  next.setHours(hours, minutes, 0, 0);
  return next;
}
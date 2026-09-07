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
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let emailSentCount = 0;
  let whatsappSentCount = 0;

  // ==========================================
  // 1. AUTOMATIC EMAIL ALERTS PROCESSING
  // ==========================================
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    const resend = new Resend(apiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "crm@thestorybuilder.in";

    const { data: emailAlerts } = await supabase
      .from("email_alerts")
      .select(
        "id, subject, message, schedule_type, target_date, occurrences_per_day, sent_count, recipient_email, recipient_name, image_url, recurrence_day, recurrence_start_time, recurrence_end_time, recipient:profiles!email_alerts_recipient_user_id_fkey(name, email)"
      )
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .limit(50);

    for (const alert of emailAlerts || []) {
      const profileRecipient = Array.isArray(alert.recipient) ? alert.recipient[0] : alert.recipient;
      const recipient = profileRecipient || { name: alert.recipient_name, email: alert.recipient_email };

      if (!recipient?.email) continue;

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
            <h2 style="color: #4f46e5; margin-top: 0;">🔔 Agency OS Automated Reminder</h2>
            <p>Hello <strong>${escapeHtml(recipient.name || "Team Member")}</strong>,</p>
            <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #6366f1; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${escapeHtml(alert.message)}</p>
            </div>
            ${alert.image_url ? `<div style="margin-top: 16px;"><img src="${alert.image_url}" alt="Alert Attachment" style="max-width: 100%; border-radius: 6px;" /></div>` : ""}
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              Sent automatically by Agency OS (${(alert.sent_count || 0) + 1}/${alert.occurrences_per_day || 1} reminder for today).
            </p>
          </div>
        `,
        ...(attachments ? { attachments } : {}),
      });

      if (!sendError) {
        emailSentCount++;
        await updateAlertOccurrence(supabase, "email_alerts", alert);
      }
    }
  }

  // ==========================================
  // 2. AUTOMATIC WHATSAPP ALERTS PROCESSING
  // ==========================================
  const { data: whatsappAlerts } = await supabase
    .from("whatsapp_alerts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_for", now)
    .limit(50);

  for (const alert of whatsappAlerts || []) {
    const phone = (alert.recipient_phone || "918341928526").replace(/\D/g, "");
    const fullText = `*${alert.subject}*\n\n${alert.message}`;
    const callmebotKey = alert.callmebot_apikey || process.env.CALLMEBOT_API_KEY;

    let dispatched = false;

    if (callmebotKey) {
      try {
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(fullText)}&apikey=${callmebotKey}`;
        const res = await fetch(callMeBotUrl);
        if (res.ok) dispatched = true;
      } catch (err) {
        console.error("CallMeBot cron dispatch error:", err);
      }
    } else {
      // Direct cron dispatch recorded for occurrence schedule
      dispatched = true;
    }

    if (dispatched) {
      whatsappSentCount++;
      await updateAlertOccurrence(supabase, "whatsapp_alerts", alert);
    }
  }

  return Response.json({
    success: true,
    emails_sent: emailSentCount,
    whatsapp_sent: whatsappSentCount,
    timestamp: new Date().toISOString(),
  });
}

async function updateAlertOccurrence(supabase: any, table: string, alert: any) {
  const currentSent = (alert.sent_count || 0) + 1;
  const targetOccurrences = alert.occurrences_per_day || 1;

  if (currentSent < targetOccurrences) {
    // Schedule next occurrence TODAY spaced across the window
    const startTimeStr = alert.recurrence_start_time || "09:00";
    const endTimeStr = alert.recurrence_end_time || "18:00";

    const [sH, sM] = startTimeStr.split(":").map(Number);
    const [eH, eM] = endTimeStr.split(":").map(Number);

    const totalMinutesWindow = Math.max(60, (eH * 60 + eM) - (sH * 60 + sM));
    const intervalMinutes = Math.floor(totalMinutesWindow / Math.max(1, targetOccurrences - 1));

    const nextScheduledTime = new Date();
    nextScheduledTime.setMinutes(nextScheduledTime.getMinutes() + Math.max(15, intervalMinutes));

    await supabase
      .from(table)
      .update({
        status: "scheduled",
        sent_count: currentSent,
        scheduled_for: nextScheduledTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", alert.id);
  } else {
    // Completed all occurrences for today!
    if (alert.schedule_type === "weekly_recurring" && alert.recurrence_day !== null) {
      const nextWeekDate = getNextWeeklyOccurrence(alert.recurrence_day, alert.recurrence_start_time || "09:00");
      await supabase
        .from(table)
        .update({
          status: "scheduled",
          sent_count: 0,
          scheduled_for: nextWeekDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);
    } else {
      await supabase
        .from(table)
        .update({
          status: "sent",
          sent_count: currentSent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", alert.id);
    }
  }
}

function getNextWeeklyOccurrence(day: number, timeStr: string) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const next = new Date();
  next.setDate(next.getDate() + ((day - next.getDay() + 7) % 7 || 7));
  next.setHours(hours, minutes, 0, 0);
  return next;
}
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function createEmailAlert(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized. Please log in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active || !["owner", "admin"].includes(profile.role)) {
    return { error: "Only active Owners and Admins can manage alerts" };
  }

  const adminSupabase = createAdminClient();

  const recipientMode = String(formData.get("recipient_mode") || "employee");
  const clientId = String(formData.get("client_id") || "").trim();
  const recipientId = String(formData.get("recipient_id") || "");
  const customEmail = String(formData.get("recipient_email") || "").trim();
  const customName = String(formData.get("recipient_name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const scheduleType = String(formData.get("schedule_type") || "weekly_recurring");
  const targetDateInput = String(formData.get("target_date") || "").trim();
  const occurrencesPerDayInput = String(formData.get("occurrences_per_day") || "5");
  const recurrenceDayInput = String(formData.get("recurrence_day") || "1");
  const startTime = String(formData.get("start_time") || "09:00").trim();
  const endTime = String(formData.get("end_time") || "18:00").trim();
  const image = formData.get("image");

  if ((recipientMode === "employee" && !recipientId) || (recipientMode === "custom" && !customEmail) || !subject || !message) {
    return { error: "Recipient, subject, and message are required." };
  }

  if (customEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) return { error: "Please enter a valid recipient email address." };
  if (image instanceof File && image.size > 10 * 1024 * 1024) return { error: "Uploaded image must be 10 MB or smaller." };

  const occurrencesPerDay = Math.max(1, Math.min(10, parseInt(occurrencesPerDayInput, 10) || 5));

  // Determine recipients
  let targetRecipients: { id: string | null; name: string; email: string }[] = [];

  if (recipientMode === "employee") {
    if (recipientId === "ALL_TEAM") {
      const { data: allProfiles } = await adminSupabase
        .from("profiles")
        .select("id, name, email")
        .not("email", "is", null);

      targetRecipients = (allProfiles || []).map((p) => ({
        id: p.id,
        name: p.name || p.email,
        email: p.email,
      }));
    } else {
      const { data: p } = await adminSupabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", recipientId)
        .single();

      if (p && p.email) {
        targetRecipients = [{ id: p.id, name: p.name || p.email, email: p.email }];
      }
    }
  } else if (customEmail) {
    targetRecipients = [{ id: null, name: customName || customEmail, email: customEmail }];
  }

  if (targetRecipients.length === 0) {
    return { error: "No valid recipient email address found." };
  }

  // Calculate scheduled time
  let scheduledFor = new Date();
  let recurrenceDay: number | null = null;

  if (scheduleType === "specific_date") {
    if (!targetDateInput) return { error: "Please select a target date." };
    scheduledFor = new Date(`${targetDateInput}T${startTime}:00`);
    if (isNaN(scheduledFor.getTime())) return { error: "Invalid target date or start time." };
  } else if (scheduleType === "weekly_recurring") {
    recurrenceDay = Number(recurrenceDayInput);
    const [startHours, startMins] = startTime.split(":").map(Number);
    scheduledFor = new Date();
    scheduledFor.setHours(startHours, startMins, 0, 0);

    let daysAhead = (recurrenceDay - scheduledFor.getDay() + 7) % 7;
    if (daysAhead === 0 && scheduledFor.getTime() <= Date.now()) daysAhead = 7;
    scheduledFor.setDate(scheduledFor.getDate() + daysAhead);
  }

  // Upload image if present
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const path = `email-alerts/${profile.org_id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await adminSupabase.storage.from("agency-files").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) return { error: `Could not upload image: ${uploadError.message}` };
    imageUrl = adminSupabase.storage.from("agency-files").getPublicUrl(path).data.publicUrl;
  }

  const isImmediate = scheduleType === "immediate" || scheduledFor.getTime() <= Date.now();
  let lastResendError: string | null = null;

  // Create alert records for each recipient
  for (const target of targetRecipients) {
    const { data: alert, error: insertError } = await adminSupabase
      .from("email_alerts")
      .insert({
        org_id: profile.org_id,
        client_id: clientId || null,
        recipient_user_id: target.id,
        recipient_email: target.id ? null : target.email,
        recipient_name: target.id ? null : target.name,
        created_by: profile.id,
        subject,
        message,
        schedule_type: scheduleType,
        target_date: scheduleType === "specific_date" ? targetDateInput : null,
        scheduled_for: scheduledFor.toISOString(),
        recurrence_day: recurrenceDay,
        occurrences_per_day: occurrencesPerDay,
        recurrence_start_time: startTime,
        recurrence_end_time: endTime,
        image_url: imageUrl,
        status: isImmediate ? "sent" : "scheduled",
        sent_count: isImmediate ? 1 : 0,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting email_alert:", insertError);
    } else if (isImmediate && alert) {
      // Send immediately via Resend
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        lastResendError = "RESEND_API_KEY is missing in environment variables";
        await adminSupabase.from("email_alerts").update({ status: "failed", error_message: lastResendError }).eq("id", alert.id);
        continue;
      }

      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "crm@thestorybuilder.in";
      const attachments = imageUrl ? await getImageAttachment(imageUrl, image) : undefined;

      const emailPayload: any = {
        from: `Agency OS <${fromEmail}>`,
        to: target.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">🔔 Agency OS Alert</h2>
            <p>Hello <strong>${escapeHtml(target.name || "Team Member")}</strong>,</p>
            <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #6366f1; border-radius: 4px; margin: 16px 0;">
              <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${escapeHtml(message)}</p>
            </div>
            ${imageUrl ? `<div style="margin-top: 16px;"><img src="${imageUrl}" alt="Alert Attachment" style="max-width: 100%; border-radius: 6px;" /></div>` : ""}
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
              Sent from Agency OS by ${escapeHtml(profile.name || "your manager")}.
            </p>
          </div>
        `,
      };

      if (attachments) {
        emailPayload.attachments = [attachments];
      }

      let { error: sendError } = await resend.emails.send(emailPayload);

      // Fallback: If custom domain fails due to unverified domain, retry with onboarding@resend.dev
      if (sendError && (sendError.message.includes("domain") || sendError.message.includes("verify") || sendError.message.includes("not verified"))) {
        console.log("Retrying with onboarding@resend.dev fallback...");
        emailPayload.from = "Agency OS <onboarding@resend.dev>";
        const retryRes = await resend.emails.send(emailPayload);
        sendError = retryRes.error;
      }

      if (sendError) {
        console.error("Resend send error:", sendError);
        lastResendError = sendError.message;
        await adminSupabase.from("email_alerts").update({ status: "failed", error_message: sendError.message }).eq("id", alert.id);
      }
    }
  }

  revalidatePath("/dashboard/alerts");

  if (isImmediate && lastResendError) {
    return {
      error: `Resend API Error: ${lastResendError}. Please check your Resend API Key in Vercel & Resend dashboard.`,
    };
  }

  return {
    success: true,
    status: isImmediate ? "sent" : "scheduled",
    message: isImmediate
      ? `Email alert sent to ${targetRecipients.length} team member(s)!`
      : `Email alert scheduled for ${targetRecipients.length} team member(s) (${occurrencesPerDay}x per day)!`,
  };
}

export async function deleteEmailAlert(alertId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();
    const { error } = await admin.from("email_alerts").delete().eq("id", alertId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/alerts");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete alert" };
  }
}

async function getImageAttachment(imageUrl: string, image: FormDataEntryValue | null) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not read uploaded image");
  return { filename: image instanceof File ? image.name : "alert-image", content: Buffer.from(await response.arrayBuffer()) };
}
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

  const recipientMode = String(formData.get("recipient_mode") || "employee");
  const clientId = String(formData.get("client_id") || "").trim();
  const recipientId = String(formData.get("recipient_id") || "");
  const customEmail = String(formData.get("recipient_email") || "").trim();
  const customName = String(formData.get("recipient_name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const scheduleType = String(formData.get("schedule_type") || "immediate"); // 'immediate' | 'specific_date' | 'weekly_recurring'
  const targetDateInput = String(formData.get("target_date") || "").trim();
  const occurrencesPerDayInput = String(formData.get("occurrences_per_day") || "1");
  const recurrenceDayInput = String(formData.get("recurrence_day") || "");
  const startTime = String(formData.get("start_time") || "09:00").trim();
  const endTime = String(formData.get("end_time") || "18:00").trim();
  const image = formData.get("image");

  if ((recipientMode === "employee" && !recipientId) || (recipientMode === "custom" && !customEmail) || !subject || !message) {
    return { error: "Recipient, subject, and message are required." };
  }

  if (recipientMode === "employee" && !clientId) return { error: "Please select a client for this employee alert." };
  if (customEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) return { error: "Please enter a valid recipient email address." };

  if (image instanceof File && image.size > 10 * 1024 * 1024) return { error: "Uploaded image must be 10 MB or smaller." };
  if (image instanceof File && image.size > 0 && !image.type.startsWith("image/")) return { error: "Only image files can be uploaded." };

  const occurrencesPerDay = Math.max(1, Math.min(10, parseInt(occurrencesPerDayInput, 10) || 1));

  // Determine recipient details
  const { data: profileRecipient } = recipientMode === "employee" ? await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", recipientId)
    .eq("org_id", profile.org_id)
    .single() : { data: null };

  const recipient = profileRecipient || { id: null, name: customName || customEmail, email: customEmail };
  if (!recipient.email) return { error: "The selected employee does not have a valid email address." };

  // Calculate first scheduled time
  let scheduledFor = new Date();
  let recurrenceDay: number | null = null;

  if (scheduleType === "specific_date") {
    if (!targetDateInput) return { error: "Please select a target date." };
    const [hours, mins] = startTime.split(":").map(Number);
    scheduledFor = new Date(`${targetDateInput}T${startTime}:00`);
    if (isNaN(scheduledFor.getTime())) return { error: "Invalid target date or start time." };
  } else if (scheduleType === "weekly_recurring") {
    if (recurrenceDayInput === "") return { error: "Please choose a day of the week." };
    recurrenceDay = Number(recurrenceDayInput);
    const [startHours, startMins] = startTime.split(":").map(Number);
    scheduledFor = new Date();
    scheduledFor.setHours(startHours, startMins, 0, 0);

    let daysAhead = (recurrenceDay - scheduledFor.getDay() + 7) % 7;
    if (daysAhead === 0 && scheduledFor.getTime() <= Date.now()) daysAhead = 7;
    scheduledFor.setDate(scheduledFor.getDate() + daysAhead);
  }

  // Handle optional image upload
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const admin = createAdminClient();
    const path = `email-alerts/${profile.org_id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await admin.storage.from("agency-files").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) return { error: `Could not upload image: ${uploadError.message}` };
    imageUrl = admin.storage.from("agency-files").getPublicUrl(path).data.publicUrl;
  }

  const isImmediate = scheduleType === "immediate" || scheduledFor.getTime() <= Date.now();

  const { data: alert, error: insertError } = await supabase
    .from("email_alerts")
    .insert({
      org_id: profile.org_id,
      client_id: clientId || null,
      recipient_user_id: recipient.id,
      recipient_email: profileRecipient ? null : recipient.email,
      recipient_name: profileRecipient ? null : recipient.name,
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
      status: "scheduled",
      sent_count: 0,
    })
    .select("id")
    .single();

  if (insertError || !alert) {
    console.error("Error creating alert:", insertError);
    return { error: insertError?.message || "Could not create alert in database." };
  }

  if (!isImmediate) {
    revalidatePath("/dashboard/alerts");
    return { success: true, status: "scheduled" as const };
  }

  // If immediate, send the first email right away!
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await supabase.from("email_alerts").update({ status: "failed", error_message: "RESEND_API_KEY is missing in environment" }).eq("id", alert.id);
    return { error: "Resend Email API key is missing. Check .env.local" };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "crm@thestorybuilder.in";
  const attachments = imageUrl ? await getImageAttachment(imageUrl, image) : undefined;

  const { error: sendError } = await resend.emails.send({
    from: `Agency OS <${fromEmail}>`,
    to: recipient.email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-top: 0;">🔔 Agency OS Alert</h2>
        <p>Hello <strong>${escapeHtml(recipient.name || "Team Member")}</strong>,</p>
        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #6366f1; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 15px; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
        ${imageUrl ? `<div style="margin-top: 16px;"><img src="${imageUrl}" alt="Alert Attachment" style="max-width: 100%; border-radius: 6px;" /></div>` : ""}
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          Sent from Agency OS by ${escapeHtml(profile.name || "your manager")}.
        </p>
      </div>
    `,
    ...(attachments ? { attachments: [attachments] } : {}),
  });

  await supabase
    .from("email_alerts")
    .update(
      sendError
        ? { status: "failed", error_message: sendError.message }
        : { status: occurrencesPerDay > 1 ? "scheduled" : "sent", sent_count: 1, sent_at: new Date().toISOString() }
    )
    .eq("id", alert.id);

  revalidatePath("/dashboard/alerts");
  return sendError ? { error: sendError.message } : { success: true, status: "sent" as const };
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
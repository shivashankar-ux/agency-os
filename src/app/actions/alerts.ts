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

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active || !["owner", "admin"].includes(profile.role)) {
    return { error: "Only active Owners and Admins can create alerts" };
  }

  const recipientMode = String(formData.get("recipient_mode") || "employee");
  const recipientId = String(formData.get("recipient_id") || "");
  const customEmail = String(formData.get("recipient_email") || "").trim();
  const customName = String(formData.get("recipient_name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const scheduledForInput = String(formData.get("scheduled_for") || "");
  const recurrenceDayInput = String(formData.get("recurrence_day") || "");
  const recurrenceTime = String(formData.get("recurrence_time") || "").trim() || null;
  const image = formData.get("image");

  if ((recipientMode === "employee" && !recipientId) || (recipientMode === "custom" && !customEmail) || !subject || !message) {
    return { error: "Recipient, subject, and message are required" };
  }

  if (customEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customEmail)) return { error: "Enter a valid recipient email" };
  if (image instanceof File && image.size > 10 * 1024 * 1024) return { error: "Image must be 10 MB or smaller" };
  if (image instanceof File && image.size > 0 && !image.type.startsWith("image/")) return { error: "Only image files can be uploaded" };

  const recurrenceDay = recurrenceDayInput === "" ? null : Number(recurrenceDayInput);
  if (recurrenceDay !== null && (!Number.isInteger(recurrenceDay) || recurrenceDay < 0 || recurrenceDay > 6)) return { error: "Choose a valid weekly day" };
  if (recurrenceDay !== null && !recurrenceTime) return { error: "Choose a weekly send time" };
  const scheduledFor = recurrenceDay !== null
    ? getNextWeeklyOccurrence(recurrenceDay, recurrenceTime as string)
    : scheduledForInput ? new Date(scheduledForInput) : new Date();
  if (Number.isNaN(scheduledFor.getTime())) return { error: "Choose a valid send time" };

  const { data: profileRecipient } = recipientMode === "employee" ? await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", recipientId)
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .single() : { data: null };

  const recipient = profileRecipient || { id: null, name: customName || customEmail, email: customEmail };
  if (!recipient.email) return { error: "That employee does not have an active email profile" };

  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const admin = createAdminClient();
    const path = `email-alerts/${profile.org_id}/${crypto.randomUUID()}-${image.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await admin.storage.from("agency-files").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) return { error: `Could not upload image: ${uploadError.message}` };
    imageUrl = admin.storage.from("agency-files").getPublicUrl(path).data.publicUrl;
  }

  const isImmediate = scheduledFor.getTime() <= Date.now();
  const { data: alert, error: insertError } = await supabase
    .from("email_alerts")
    .insert({
      org_id: profile.org_id,
      recipient_user_id: recipient.id,
      recipient_email: profileRecipient ? null : recipient.email,
      recipient_name: profileRecipient ? null : recipient.name,
      created_by: profile.id,
      subject,
      message,
      scheduled_for: scheduledFor.toISOString(),
      recurrence_day: recurrenceDay,
      recurrence_time: recurrenceTime,
      image_url: imageUrl,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (insertError || !alert) return { error: insertError?.message || "Could not create alert" };
  if (!isImmediate) {
    revalidatePath("/dashboard/alerts");
    return { success: true, status: "scheduled" as const };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await supabase.from("email_alerts").update({ status: "failed", error_message: "RESEND_API_KEY is missing" }).eq("id", alert.id);
    return { error: "Email service is not configured" };
  }

  const resend = new Resend(apiKey);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const attachments = imageUrl ? await getImageAttachment(imageUrl, image) : undefined;
  const { error: sendError } = await resend.emails.send({
    from: `Agency OS <${fromEmail}>`,
    to: recipient.email,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#334155;line-height:1.6"><p>Hello ${escapeHtml(recipient.name || "there")},</p><p>${escapeHtml(message).replaceAll("\n", "<br />")}</p><p style="color:#94a3b8;font-size:12px">Sent from Agency OS by ${escapeHtml(profile.name || "your admin")}.</p></div>`,
    ...(attachments ? { attachments: [attachments] } : {}),
  });

  await supabase
    .from("email_alerts")
    .update(sendError ? { status: "failed", error_message: sendError.message } : { status: "sent", sent_at: new Date().toISOString() })
    .eq("id", alert.id);

  revalidatePath("/dashboard/alerts");
  return sendError ? { error: sendError.message } : { success: true, status: "sent" as const };
}

async function getImageAttachment(imageUrl: string, image: FormDataEntryValue | null) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Could not read uploaded image");
  return { filename: image instanceof File ? image.name : "alert-image", content: Buffer.from(await response.arrayBuffer()) };
}

function getNextWeeklyOccurrence(day: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const occurrence = new Date();
  occurrence.setHours(hours, minutes, 0, 0);
  let daysAhead = (day - occurrence.getDay() + 7) % 7;
  if (daysAhead === 0 && occurrence.getTime() <= Date.now()) daysAhead = 7;
  occurrence.setDate(occurrence.getDate() + daysAhead);
  return occurrence;
}
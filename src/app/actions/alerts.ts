"use server";

import { createClient } from "@/lib/supabase/server";
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

  const recipientId = String(formData.get("recipient_id") || "");
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const scheduledForInput = String(formData.get("scheduled_for") || "");

  if (!recipientId || !subject || !message) {
    return { error: "Employee, subject, and message are required" };
  }

  const scheduledFor = scheduledForInput ? new Date(scheduledForInput) : new Date();
  if (Number.isNaN(scheduledFor.getTime())) return { error: "Choose a valid send time" };

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", recipientId)
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .single();

  if (!recipient?.email) return { error: "That employee does not have an active email profile" };

  const isImmediate = scheduledFor.getTime() <= Date.now();
  const { data: alert, error: insertError } = await supabase
    .from("email_alerts")
    .insert({
      org_id: profile.org_id,
      recipient_user_id: recipient.id,
      created_by: profile.id,
      subject,
      message,
      scheduled_for: scheduledFor.toISOString(),
      status: isImmediate ? "scheduled" : "scheduled",
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
  const { error: sendError } = await resend.emails.send({
    from: `Agency OS <${fromEmail}>`,
    to: recipient.email,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;color:#334155;line-height:1.6"><p>Hello ${escapeHtml(recipient.name || "there")},</p><p>${escapeHtml(message).replaceAll("\n", "<br />")}</p><p style="color:#94a3b8;font-size:12px">Sent from Agency OS by ${escapeHtml(profile.name || "your admin")}.</p></div>`,
  });

  await supabase
    .from("email_alerts")
    .update(sendError ? { status: "failed", error_message: sendError.message } : { status: "sent", sent_at: new Date().toISOString() })
    .eq("id", alert.id);

  revalidatePath("/dashboard/alerts");
  return sendError ? { error: sendError.message } : { success: true, status: "sent" as const };
}
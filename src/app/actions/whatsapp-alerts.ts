"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createWhatsAppAlert(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized. Please log in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, name, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) {
    return { error: "Only active team members can manage WhatsApp alerts" };
  }

  const adminSupabase = createAdminClient();

  const recipientMode = String(formData.get("recipient_mode") || "employee");
  const clientId = String(formData.get("client_id") || "").trim();
  const recipientId = String(formData.get("recipient_id") || "");
  let customPhoneInput = String(formData.get("recipient_phone") || "").trim();
  const customName = String(formData.get("recipient_name") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const callmebotApiKey = String(formData.get("callmebot_apikey") || "").trim();

  // Default to 8341928526 if no phone provided
  if (!customPhoneInput) {
    customPhoneInput = "8341928526";
  }

  const scheduleType = String(formData.get("schedule_type") || "weekly_recurring");
  const targetDateInput = String(formData.get("target_date") || "").trim();
  const occurrencesPerDayInput = String(formData.get("occurrences_per_day") || "5");
  const recurrenceDayInput = String(formData.get("recurrence_day") || "1");
  const startTime = String(formData.get("start_time") || "09:00").trim();
  const endTime = String(formData.get("end_time") || "18:00").trim();

  if (!subject || !message) {
    return { error: "Subject and message are required." };
  }

  const occurrencesPerDay = Math.max(1, Math.min(10, parseInt(occurrencesPerDayInput, 10) || 5));

  // Format phone number
  const cleanPhone = customPhoneInput.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone || "918341928526";

  const PREDEFINED_TEAM: Record<string, { name: string; phone: string }> = {
    shiva: { name: "Shiva Shankar", phone: "918341928526" },
    test: { name: "Test Number", phone: "918186939526" },
    bharath: { name: "Bharath", phone: "919652388859" },
    heena: { name: "Heena", phone: "918828396623" },
    sathwika: { name: "Sathwika", phone: "918688213692" },
    umesh: { name: "Umesh", phone: "918465903707" },
  };

  // Determine recipients
  let targetRecipients: { id: string | null; name: string; phone: string }[] = [];

  if (recipientMode === "employee") {
    if (recipientId === "ALL_TEAM") {
      targetRecipients = Object.values(PREDEFINED_TEAM).map((tm) => ({
        id: null,
        name: tm.name,
        phone: tm.phone,
      }));
    } else if (PREDEFINED_TEAM[recipientId]) {
      const tm = PREDEFINED_TEAM[recipientId];
      targetRecipients = [{ id: null, name: tm.name, phone: tm.phone }];
    } else {
      const { data: p } = await adminSupabase
        .from("profiles")
        .select("id, name, email")
        .eq("id", recipientId)
        .single();

      if (p) {
        targetRecipients = [{ id: p.id, name: p.name || p.email, phone: formattedPhone }];
      }
    }
  } else {
    targetRecipients = [{ id: null, name: customName || formattedPhone, phone: formattedPhone }];
  }

  if (targetRecipients.length === 0) {
    targetRecipients = [{ id: null, name: "Default Contact", phone: "918341928526" }];
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

  const isImmediate = scheduleType === "immediate" || scheduledFor.getTime() <= Date.now();
  let createdAlertId: string | null = null;

  const fullText = `*${subject}*\n\n${message}`;

  for (const target of targetRecipients) {
    const phoneToUse = target.phone ? target.phone.replace(/\D/g, "") : formattedPhone;

    const { data: alert, error: insertError } = await adminSupabase
      .from("whatsapp_alerts")
      .insert({
        org_id: profile.org_id,
        client_id: clientId || null,
        recipient_user_id: target.id,
        recipient_phone: phoneToUse,
        recipient_name: target.name,
        sender_id: profile.id,
        subject,
        message,
        schedule_type: scheduleType,
        target_date: scheduleType === "specific_date" ? targetDateInput : null,
        scheduled_for: scheduledFor.toISOString(),
        recurrence_day: recurrenceDay,
        occurrences_per_day: occurrencesPerDay,
        recurrence_start_time: startTime,
        recurrence_end_time: endTime,
        callmebot_apikey: callmebotApiKey || process.env.CALLMEBOT_API_KEY || null,
        status: isImmediate ? "sent" : "scheduled",
        sent_count: isImmediate ? 1 : 0,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting whatsapp_alert:", insertError);
    } else if (alert) {
      createdAlertId = alert.id;
    }

    // Try automated WhatsApp API dispatch if CallMeBot API Key is present
    if (isImmediate && process.env.CALLMEBOT_API_KEY) {
      try {
        const callMeBotUrl = `https://api.callmebot.com/whatsapp.php?phone=${phoneToUse}&text=${encodeURIComponent(fullText)}&apikey=${process.env.CALLMEBOT_API_KEY}`;
        await fetch(callMeBotUrl);
      } catch (err) {
        console.error("CallMeBot automated send error:", err);
      }
    }
  }

  // Generate 1-click WhatsApp web link
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(fullText)}`;

  revalidatePath("/dashboard/whatsapp-alerts");

  return {
    success: true,
    whatsappUrl,
    alertId: createdAlertId,
    status: isImmediate ? "sent" : "scheduled",
    message: isImmediate
      ? `WhatsApp alert generated for +${formattedPhone}! Click link below or open WhatsApp.`
      : `WhatsApp alert scheduled for +${formattedPhone} (${occurrencesPerDay}x per day)!`,
  };
}

export async function deleteWhatsAppAlert(alertId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const admin = createAdminClient();
    const { error } = await admin.from("whatsapp_alerts").delete().eq("id", alertId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/whatsapp-alerts");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to delete WhatsApp alert" };
  }
}

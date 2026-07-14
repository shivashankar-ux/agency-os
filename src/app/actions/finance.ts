"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import webPush from "web-push";

// Helper to notify owners and admins
async function notifyOwnersAndAdmins(supabase: any, title: string, body: string, url: string) {
  try {
    // Find all owners and admins
    const { data: privilegedUsers } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["owner", "admin"]);

    if (!privilegedUsers || privilegedUsers.length === 0) return;

    const userIds = privilegedUsers.map((u: any) => u.id);

    // Get all subscriptions for these users
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("subscription, user_id")
      .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0 || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;

    webPush.setVapidDetails(
      "mailto:admin@thestorybuilder.in",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Get preferences to check siren settings
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select("user_id, siren_enabled")
      .in("user_id", userIds);

    const prefsMap = new Map(prefs?.map((p: any) => [p.user_id, p.siren_enabled]) || []);

    const promises = subscriptions.map((sub: any) => {
      const sirenEnabled = prefsMap.get(sub.user_id) !== false;
      const payload = JSON.stringify({
        title,
        body,
        url,
        tag: `finance-${Date.now()}`,
        vibrate: sirenEnabled 
          ? [500, 200, 500, 200, 500, 200, 1000] // Aggressive
          : [200, 100, 200, 100, 200, 100, 400], // Standard
      });
      return webPush.sendNotification(sub.subscription as any, payload).catch(e => console.error(e));
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Failed to notify owners/admins:", error);
  }
}

export async function createInvoice(formData: FormData) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "Unauthorized" };

    const permissions = await getPermissions(profile.id);
    if (!permissions.finance?.can_create) {
      return { error: "You do not have permission to create invoices" };
    }

    const invoiceNumber = formData.get("invoice_number") as string;
    const clientId = formData.get("client_id") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const gstAmount = parseFloat(formData.get("gst_amount") as string || "0");
    const status = formData.get("status") as string;
    const issueDate = formData.get("issue_date") as string;
    const dueDate = formData.get("due_date") as string;

    if (!invoiceNumber || !clientId || isNaN(amount)) {
      return { error: "Missing required fields" };
    }

    const supabase = await createClient();

    const { data: newInvoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        client_id: clientId,
        amount,
        gst_amount: gstAmount,
        status,
        issue_date: issueDate,
        due_date: dueDate || null,
      })
      .select("*, clients(name)")
      .single();

    if (error) {
      console.error("Invoice creation failed:", error);
      return { error: error.message };
    }

    // Notify owners
    await notifyOwnersAndAdmins(
      supabase,
      "New Invoice Created",
      `Invoice ${invoiceNumber} created for ${newInvoice.clients?.name} (₹${newInvoice.total_amount})`,
      "/dashboard/finance"
    );

    revalidatePath("/dashboard/finance");
    revalidatePath(`/dashboard/clients/${clientId}`);
    
    return { success: true, invoice: newInvoice };
  } catch (error: any) {
    console.error("Create invoice exception:", error);
    return { error: error.message || "Internal server error" };
  }
}

export async function updateInvoiceStatus(invoiceId: string, newStatus: string) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "Unauthorized" };

    const permissions = await getPermissions(profile.id);
    if (!permissions.finance?.can_edit) {
      return { error: "You do not have permission to edit invoices" };
    }

    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .update({ status: newStatus })
      .eq("id", invoiceId)
      .select("*, clients(name)")
      .single();

    if (error) {
      console.error("Invoice update failed:", error);
      return { error: error.message };
    }

    // If marked as paid, notify owners
    if (newStatus === "paid") {
      await notifyOwnersAndAdmins(
        supabase,
        "Invoice Paid! 🎉",
        `Invoice ${invoice.invoice_number} for ${invoice.clients?.name} was marked as paid.`,
        "/dashboard/finance"
      );
    }

    revalidatePath("/dashboard/finance");
    revalidatePath(`/dashboard/clients/${invoice.client_id}`);
    
    return { success: true, invoice };
  } catch (error: any) {
    console.error("Update invoice exception:", error);
    return { error: error.message || "Internal server error" };
  }
}

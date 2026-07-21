"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_TEMPLATES = [
  {
    type: "welcome",
    name: "Standard Welcome Document",
    content: {
      sections: [
        { id: "s1", heading: "Welcome Letter", body: "We are thrilled to embark on this growth journey with you. Our dedicated team is committed to driving outstanding strategy and results for your brand." },
        { id: "s2", heading: "Scope of Partnership", body: "We will act as your dedicated partners to build your digital presence, execute targeted strategies, and align with your key marketing goals." }
      ],
      fields: [
        { name: "welcome_message", label: "Custom Welcome Message", type: "textarea" },
        { name: "scope_summary", label: "Scope & Commitment Summary", type: "textarea" }
      ]
    }
  },
  {
    type: "onboarding",
    name: "Standard Onboarding Guide",
    content: {
      sections: [
        { id: "s1", heading: "Getting Started", body: "To kick off our operations, we require setup parameters, brand guidelines, and assets. Please review the checklist below." },
        { id: "s2", heading: "Communication Channels", body: "We utilize Slack for real-time messaging, Google Meet for status updates, and ClickUp for task progress transparency." }
      ],
      fields: [
        { name: "welcome_message", label: "Onboarding Instructions", type: "textarea" },
        { name: "scope_summary", label: "Milestones & Timelines", type: "textarea" }
      ]
    }
  },
  {
    type: "advance_invoice",
    name: "Standard Advance Invoice",
    content: {
      sections: [
        { id: "s1", heading: "Billing Terms", body: "Payment is due within 7 business days from the date of receipt." }
      ],
      fields: [
        { name: "service_description", label: "Service / Item Description", type: "text" },
        { name: "total_amount", label: "Total Amount (₹)", type: "number" }
      ]
    }
  },
  {
    type: "final_invoice",
    name: "Standard Final Invoice",
    content: {
      sections: [
        { id: "s1", heading: "Tax Terms", body: "All bank transfers should specify the invoice number for verification." }
      ],
      fields: [
        { name: "service_description", label: "Service / Item Description", type: "text" },
        { name: "total_amount", label: "Total Amount (₹)", type: "number" }
      ]
    }
  }
];

export async function getDocumentTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return [];

  // Fetch templates
  let { data: templates } = await supabase
    .from("document_templates")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("type");

  // Seed default templates if they don't exist
  if (!templates || templates.length === 0) {
    const rows = DEFAULT_TEMPLATES.map((tmpl) => ({
      org_id: profile.org_id,
      type: tmpl.type,
      name: tmpl.name,
      content: tmpl.content,
      is_default: true,
      created_by: user.id
    }));

    const { data: seeded } = await supabase
      .from("document_templates")
      .insert(rows)
      .select();

    templates = seeded || [];
  }

  return templates;
}

export async function updateDocumentTemplate(templateId: string, name: string, content: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
    return { error: "Only Owners/Admins can modify document templates." };
  }

  const { error } = await supabase
    .from("document_templates")
    .update({
      name: name.trim(),
      content,
      updated_at: new Date().toISOString()
    })
    .eq("id", templateId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

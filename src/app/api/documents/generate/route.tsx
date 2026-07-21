import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/admin";
import { WelcomePdfDocument, InvoicePdfDocument } from "@/lib/pdf/templates";

export async function POST(req: NextRequest) {
  try {
    const { clientId, type, fieldData, sendEmail } = await req.json();

    if (!clientId || !type) {
      return NextResponse.json({ error: "Missing clientId or type" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch Client profile
    const { data: client, error: clientErr } = await adminSupabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // 2. Fetch Org Branding
    const { data: branding } = await adminSupabase
      .from("org_branding")
      .select("*")
      .eq("org_id", client.org_id)
      .maybeSingle();

    let pdfBuffer: Buffer;
    let invoiceNumber: string | undefined = undefined;

    // 3. Handle Auto-increment Invoice Counter if Invoice
    if (type === "advance_invoice" || type === "final_invoice") {
      const currentYear = new Date().getFullYear();
      
      const { data: counter } = await adminSupabase
        .from("invoice_counters")
        .select("*")
        .eq("org_id", client.org_id)
        .maybeSingle();

      const nextNum = (counter?.last_number || 0) + 1;
      invoiceNumber = `INV-${currentYear}-${String(nextNum).padStart(3, "0")}`;

      // Upsert new last_number
      await adminSupabase
        .from("invoice_counters")
        .upsert({
          org_id: client.org_id,
          year: currentYear,
          last_number: nextNum,
        });

      pdfBuffer = await renderToBuffer(
        (
          <InvoicePdfDocument
            branding={branding}
            client={client}
            fieldData={fieldData}
            invoiceNumber={invoiceNumber}
          />
        ) as any
      );
    } else {
      // Welcome or Onboarding PDF
      pdfBuffer = await renderToBuffer(
        (
          <WelcomePdfDocument
            branding={branding}
            client={client}
            fieldData={fieldData}
          />
        ) as any
      );
    }

    const filename = `${type}_${client.name.replace(/\s+/g, "_")}.pdf`;

    // 4. Optional Resend Email Delivery Setup
    if (sendEmail && client.email) {
      const { Resend } = require("resend");
      const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

      await resend.emails.send({
        from: "The Story Builder <shiva@thestorybuilder.in>",
        to: client.email,
        subject: `📄 New Document: ${type.replace("_", " ").toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Dear ${client.contact_person || client.name},</h2>
            <p>Please find attached your newly generated document: <strong>${type.replace("_", " ").toUpperCase()}</strong>.</p>
            <p>Best regards,<br/>${branding?.company_name || "The Story Builder Agency"}</p>
          </div>
        `,
        attachments: [
          {
            filename,
            content: pdfBuffer,
          },
        ],
      });
    }

    // Convert Buffer to Base64 for instant client download without storage requirement
    const base64Pdf = pdfBuffer.toString("base64");

    // Save record to client_documents history
    await adminSupabase
      .from("client_documents")
      .insert({
        org_id: client.org_id,
        client_id: client.id,
        type,
        status: sendEmail ? "generated" : "downloaded",
        field_data: fieldData || {},
        invoice_number: invoiceNumber || null,
      });

    return NextResponse.json({
      success: true,
      filename,
      invoiceNumber,
      base64Pdf,
    });
  } catch (err: any) {
    console.error("PDF generation route error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate PDF" }, { status: 500 });
  }
}

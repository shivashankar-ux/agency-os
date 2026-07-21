import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { registerPdfFonts } from "../font";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 36,
    backgroundColor: "#ffffff",
    color: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: "contain",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
  },
  grid: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 20,
  },
  col: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  table: {
    width: "100%",
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    padding: 8,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
    fontWeight: 700,
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
  badge: {
    backgroundColor: "#4f46e5",
    color: "#ffffff",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
  },
});

interface PdfProps {
  branding: any;
  client: any;
  fieldData: any;
  invoiceNumber?: string;
}

export function WelcomePdfDocument({ branding, client, fieldData }: PdfProps) {
  const primaryColor = branding?.primary_color || "#4f46e5";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: primaryColor }]}>WELCOME TO OUR AGENCY</Text>
            <Text style={styles.subtitle}>{branding?.company_name || "The Story Builder Agency"}</Text>
          </View>
          {branding?.logo_url ? (
            <Image src={branding.logo_url} style={styles.logo} />
          ) : (
            <Text style={styles.badge}>{branding?.company_name || "AGENCY OS"}</Text>
          )}
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>PREPARED FOR</Text>
            <Text style={{ fontWeight: 700, fontSize: 12 }}>{client?.name}</Text>
            <Text style={{ color: "#64748b", marginTop: 4 }}>Contact: {client?.contact_person || client?.email || "—"}</Text>
            <Text style={{ color: "#64748b" }}>Date: {fieldData?.date || new Date().toLocaleDateString()}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>OUR COMMITMENT</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5 }}>
              {fieldData?.welcome_message ||
                "We are thrilled to embark on this growth journey with you. Our dedicated team is committed to driving outstanding strategy and results for your brand."}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.sectionTitle}>ENGAGEMENT OVERVIEW & SCOPE</Text>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: "#334155" }}>
            {fieldData?.scope_summary ||
              `Contract Type: ${client?.contract_type || "Retainer"}\nMonthly Commitment: ₹${Number(client?.monthly_retainer_value || 0).toLocaleString("en-IN")}`}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>{branding?.company_name} | GSTIN: {branding?.gstin || "N/A"}</Text>
          <Text>{branding?.company_address || "Confidential"}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function InvoicePdfDocument({ branding, client, fieldData, invoiceNumber }: PdfProps) {
  const primaryColor = branding?.primary_color || "#4f46e5";
  const items = fieldData?.line_items || [
    { description: fieldData?.service_description || "Professional Agency Services", amount: fieldData?.total_amount || client?.monthly_retainer_value || 0 },
  ];

  const total = items.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: primaryColor }]}>TAX INVOICE</Text>
            <Text style={styles.subtitle}>Invoice #: {invoiceNumber || "INV-2026-001"}</Text>
          </View>
          {branding?.logo_url ? (
            <Image src={branding.logo_url} style={styles.logo} />
          ) : (
            <Text style={[styles.badge, { backgroundColor: primaryColor }]}>{branding?.company_name || "AGENCY"}</Text>
          )}
        </View>

        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BILLED FROM</Text>
            <Text style={{ fontWeight: 700 }}>{branding?.company_name || "Agency OS"}</Text>
            <Text style={{ color: "#64748b" }}>{branding?.company_address || "Hyderabad, India"}</Text>
            <Text style={{ color: "#64748b" }}>GSTIN: {branding?.gstin || "36AAAAA0000A1Z5"}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BILLED TO</Text>
            <Text style={{ fontWeight: 700 }}>{client?.name}</Text>
            <Text style={{ color: "#64748b" }}>{client?.email || "—"}</Text>
            <Text style={{ color: "#64748b" }}>GSTIN: {client?.gst_number || "N/A"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={{ flex: 3 }}>Item Description</Text>
            <Text style={{ flex: 1, textAlign: "right" }}>Amount (₹)</Text>
          </View>
          {items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={{ flex: 3 }}>{item.description}</Text>
              <Text style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>
                ₹{Number(item.amount || 0).toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 }}>
          <View style={{ width: 200, padding: 8, backgroundColor: "#f8fafc", borderRadius: 4 }}>
            <View style={{ flexDirection: "row", justifyBetween: "space-between" }}>
              <Text style={{ fontWeight: 700, fontSize: 12 }}>Total Payable:</Text>
              <Text style={{ fontWeight: 700, fontSize: 12, color: primaryColor }}>
                ₹{Number(total).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

        {branding?.bank_details && (
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>BANK PAYMENT DETAILS</Text>
            <Text style={{ fontSize: 9 }}>Account Name: {branding.bank_details.account_name || branding?.company_name}</Text>
            <Text style={{ fontSize: 9 }}>Bank: {branding.bank_details.bank_name || "—"}</Text>
            <Text style={{ fontSize: 9 }}>Account Number: {branding.bank_details.account_number || "—"}</Text>
            <Text style={{ fontSize: 9 }}>IFSC Code: {branding.bank_details.ifsc_code || "—"}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>Computer generated invoice</Text>
        </View>
      </Page>
    </Document>
  );
}

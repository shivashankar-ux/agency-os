import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { registerPdfFonts } from "./font";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    lineHeight: 1.6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 15,
    marginBottom: 25,
  },
  logo: {
    width: 120,
    height: 45,
    objectFit: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  heading2: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 15,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 3,
    textTransform: "uppercase",
  },
  text: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 10,
    textAlign: "justify",
  },
  bulletList: {
    paddingLeft: 12,
    marginBottom: 10,
  },
  bulletItem: {
    fontSize: 9.5,
    color: "#334155",
    marginBottom: 4,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  sigBox: {
    width: "45%",
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    height: 35,
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94a3b8",
  },
});

interface AgreementProps {
  branding: any;
  clientName: string;
  services: string[];
  retainerValue: number;
}

export function AgreementPdfDocument({ branding, clientName, services, retainerValue }: AgreementProps) {
  const primaryColor = branding?.primary_color || "#4f46e5";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: primaryColor }]}>SERVICE AGREEMENT</Text>
            <Text style={styles.subtitle}>Confidential Strategic Partnership Contract</Text>
          </View>
          {branding?.logo_url ? (
            <Image src={branding.logo_url} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 10, fontWeight: 700, color: primaryColor }}>{branding?.company_name || "THE STORY BUILDER"}</Text>
          )}
        </View>

        <Text style={styles.text}>
          This Service Agreement (the "Agreement") is entered into and made effective as of {new Date().toLocaleDateString("en-IN")} by and between:
        </Text>

        <Text style={[styles.text, { fontWeight: 650 }]}>
          1. {branding?.company_name || "The Story Builder Agency"}, having its office at {branding?.company_address || "Hyderabad, India"} (hereinafter referred to as the "Agency").
        </Text>
        <Text style={[styles.text, { fontWeight: 650, marginBottom: 15 }]}>
          2. {clientName} (hereinafter referred to as the "Client").
        </Text>

        <Text style={styles.heading2}>1. Scope of Services</Text>
        <Text style={styles.text}>
          The Agency shall provide the following professional services to the Client:
        </Text>
        <View style={styles.bulletList}>
          {services.map((service, index) => (
            <Text key={index} style={styles.bulletItem}>
              • {service}
            </Text>
          ))}
        </View>

        <Text style={styles.heading2}>2. Compensation & Billing Terms</Text>
        <Text style={styles.text}>
          In consideration for the professional services described above, the Client agrees to pay the Agency a monthly retainer fee of:
        </Text>
        <Text style={[styles.text, { fontWeight: 700, fontSize: 11, color: primaryColor }]}>
          ₹{Number(retainerValue).toLocaleString("en-IN")} per month + applicable taxes
        </Text>
        <Text style={styles.text}>
          Invoices will be generated and sent in advance of each monthly cycle. Payment shall be completed within 7 business days of the invoice issuance date.
        </Text>

        <Text style={styles.heading2}>3. Confidentiality & IP</Text>
        <Text style={styles.text}>
          Both parties agree to hold all brand assets, strategies, business data, and financial transactions strictly confidential. Intellectual property developed specifically for the Client will belong to the Client upon receipt of complete payments.
        </Text>

        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <Text style={{ fontWeight: 600 }}>For Agency</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 8.5, color: "#64748b" }}>Authorized Signatory</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={{ fontWeight: 600 }}>For Client</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 8.5, color: "#64748b" }}>Authorized Representative</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{branding?.company_name} | GSTIN: {branding?.gstin || "N/A"}</Text>
          <Text>Confidential Service Contract</Text>
        </View>
      </Page>
    </Document>
  );
}

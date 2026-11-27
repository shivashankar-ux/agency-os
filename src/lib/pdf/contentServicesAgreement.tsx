import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { registerPdfFonts } from "./font";

registerPdfFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    padding: 40,
    backgroundColor: "#ffffff",
    color: "#1e293b",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4f46e5",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logo: { width: 120, height: 45, objectFit: "contain" },
  title: { fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: -0.5 },
  subtitle: { fontSize: 9, color: "#64748b", marginTop: 2 },
  heading2: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 3,
    textTransform: "uppercase",
  },
  text: { fontSize: 9, color: "#334155", marginBottom: 8, textAlign: "justify" },
  fieldRow: { flexDirection: "row", marginBottom: 6 },
  fieldCol: { width: "50%" },
  fieldLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase", marginBottom: 1 },
  fieldValue: { fontSize: 9.5, fontWeight: 600, color: "#0f172a" },
  table: { marginTop: 6, marginBottom: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  tableHeaderCell: { padding: 6, fontSize: 8, fontWeight: 700, color: "#ffffff", backgroundColor: "#4f46e5" },
  tableCell: { padding: 6, fontSize: 8.5, color: "#334155" },
  tableCellSelected: { padding: 6, fontSize: 8.5, color: "#4f46e5", fontWeight: 700, backgroundColor: "#eef2ff" },
  numberedItem: { flexDirection: "row", marginBottom: 6 },
  numberedIndex: { width: 16, fontSize: 9, fontWeight: 700, color: "#4f46e5" },
  numberedText: { flex: 1, fontSize: 9, color: "#334155", textAlign: "justify" },
  numberedBold: { fontWeight: 700 },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  sigBox: { width: "45%" },
  sigLine: { borderBottomWidth: 1, borderBottomColor: "#94a3b8", height: 30, marginBottom: 5 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: "#94a3b8",
  },
});

const PLAN_DETAILS: Record<string, { label: string; duration: string; reelsPerMonth: number; totalReels: string; defaultFee: number | null }> = {
  monthly: { label: "Monthly", duration: "1 month", reelsPerMonth: 4, totalReels: "4 reels per month", defaultFee: 20000 },
  quarterly: { label: "Quarterly", duration: "3 months", reelsPerMonth: 4, totalReels: "4 reels per month (12 in total)", defaultFee: 50000 },
  half_yearly: { label: "Half-yearly", duration: "6 months", reelsPerMonth: 4, totalReels: "4 reels per month (24 in total)", defaultFee: 90000 },
  annual: { label: "Annual", duration: "12 months", reelsPerMonth: 4, totalReels: "4 reels per month (48 in total)", defaultFee: null },
};

interface ContentServicesAgreementProps {
  branding: any;
  clientName: string;
  clientAddress?: string;
  ownerName?: string;
  ownerPhone?: string;
  agreementDate?: string;
  planStartDate?: string;
  plan: "monthly" | "quarterly" | "half_yearly" | "annual";
  fee: number;
  paymentSchedule?: string;
  reschedulingFee?: number;
  revisionFee?: number;
}

export function ContentServicesAgreementPdfDocument({
  branding,
  clientName,
  clientAddress,
  ownerName,
  ownerPhone,
  agreementDate,
  planStartDate,
  plan,
  fee,
  paymentSchedule,
  reschedulingFee,
  revisionFee,
}: ContentServicesAgreementProps) {
  const primaryColor = branding?.primary_color || "#4f46e5";
  const today = agreementDate || new Date().toLocaleDateString("en-IN");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: primaryColor }]}>CONTENT SERVICES AGREEMENT</Text>
            <Text style={styles.subtitle}>Video content for gyms: planned, shot and edited by The Story Builder</Text>
          </View>
          {branding?.logo_url ? (
            <Image src={branding.logo_url} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: 10, fontWeight: 700, color: primaryColor }}>
              {branding?.company_name || "THE STORY BUILDER"}
            </Text>
          )}
        </View>

        <Text style={styles.text}>
          This agreement is made between {branding?.company_name || "The Story Builder"} (the &quot;Agency&quot;) and the gym
          named below (the &quot;Gym&quot;). It sets out how we will work together.
        </Text>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Date of agreement</Text>
            <Text style={styles.fieldValue}>{today}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Start date of plan</Text>
            <Text style={styles.fieldValue}>{planStartDate || "—"}</Text>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Agency address</Text>
            <Text style={styles.fieldValue}>{branding?.company_address || "Hyderabad, Telangana, India"}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Agency representative</Text>
            <Text style={styles.fieldValue}>Shiva</Text>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Gym name</Text>
            <Text style={styles.fieldValue}>{clientName}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Gym address</Text>
            <Text style={styles.fieldValue}>{clientAddress || "—"}</Text>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Gym owner / authorised person</Text>
            <Text style={styles.fieldValue}>{ownerName || "—"}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Phone / WhatsApp</Text>
            <Text style={styles.fieldValue}>{ownerPhone || "—"}</Text>
          </View>
        </View>

        <Text style={styles.heading2}>Selected Plan</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Plan</Text>
            <Text style={[styles.tableHeaderCell, { width: "20%" }]}>Duration</Text>
            <Text style={[styles.tableHeaderCell, { width: "36%" }]}>Reels</Text>
            <Text style={[styles.tableHeaderCell, { width: "22%" }]}>Fee (Rs.)</Text>
          </View>
          {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((key) => {
            const p = PLAN_DETAILS[key];
            const isSelected = key === plan;
            const cellStyle = isSelected ? styles.tableCellSelected : styles.tableCell;
            return (
              <View style={styles.tableRow} key={key}>
                <Text style={[cellStyle, { width: "22%" }]}>{p.label}{isSelected ? " ✓" : ""}</Text>
                <Text style={[cellStyle, { width: "20%" }]}>{p.duration}</Text>
                <Text style={[cellStyle, { width: "36%" }]}>{p.totalReels}</Text>
                <Text style={[cellStyle, { width: "22%" }]}>
                  {isSelected ? Number(fee).toLocaleString("en-IN") : p.defaultFee ? p.defaultFee.toLocaleString("en-IN") : "—"}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.text, { fontSize: 8, color: "#64748b" }]}>
          Each reel is planned, scripted, shot and edited by the Agency. GST is extra, as applicable.
        </Text>

        <Text style={styles.heading2}>Terms</Text>
        {[
          ["Services.", "The Agency will plan, script, shoot and edit short video content (reels) for the Gym as per the selected plan, help with scheduling the posts, and share a monthly report on how the content performed."],
          ["Fees and payment.", "The Gym will pay the fee for the selected plan, plus GST where applicable, before the first shoot of each period. The fee is fixed for the duration of the plan. The agreed payment schedule is written below."],
          ["Scripts, approval and shoot.", "The Agency will send scripts on WhatsApp. The Gym will approve them in writing within 48 hours. No reel is shot without an approved script. If approval is late, the shoot and posting dates move by the same number of days, and the plan is not extended."],
          ["Cancellation or rescheduling of a shoot.", "The Gym will give at least 24 hours' notice. One reschedule per month is free. A same-day cancellation, or a shoot that cannot happen when the Agency's team arrives, may be charged at the rescheduling fee below. If the Agency has to cancel, it will reschedule at no extra cost."],
          ["Revisions.", "Each reel includes up to 2 rounds of changes, sent in one message per round. Further rounds are charged at the fee below."],
          ["Gym's responsibilities.", "The Gym will give access to the premises at the agreed time, name a contact person, give accurate details of offers and prices, and make sure members and trainers on camera have given permission to appear."],
          ["Content ownership and use.", "Approved final reels may be used by the Gym on its own channels. The Agency may show them in its portfolio unless the Gym objects in writing. Raw footage and editing files stay with the Agency unless agreed otherwise in writing."],
          ["No guarantee of results.", "The Agency will deliver the content described here and will do its best to help the Gym grow. The Agency does not guarantee sales, sign-ups, leads or any particular number of views."],
          ["Term, renewal and ending.", "This agreement runs for the period of the selected plan and can be renewed in writing. Either party may end it with 30 days' written notice. Fees for a period that has already started are not refundable, and work already completed must be paid for. The Agency may pause work if a payment is overdue."],
          ["Additional branches.", "The Gym may add more branches or locations at any time by a written addendum stating the fee, number of reels and start date for each. The same process and terms will apply to each branch unless agreed otherwise."],
          ["Confidentiality.", "Both parties will keep each other's business information, prices and plans private."],
          ["Changes and law.", "Any change must be agreed in writing (email or WhatsApp is enough). This agreement is governed by the laws of India, and the courts at Hyderabad, Telangana have jurisdiction."],
        ].map(([bold, rest], i) => (
          <View style={styles.numberedItem} key={i}>
            <Text style={styles.numberedIndex}>{i + 1}.</Text>
            <Text style={styles.numberedText}>
              <Text style={styles.numberedBold}>{bold}</Text> {rest}
            </Text>
          </View>
        ))}

        <Text style={styles.heading2}>Agreed Amounts</Text>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Payment schedule agreed</Text>
            <Text style={styles.fieldValue}>{paymentSchedule || "—"}</Text>
          </View>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Rescheduling fee (Rs.)</Text>
            <Text style={styles.fieldValue}>{reschedulingFee ? reschedulingFee.toLocaleString("en-IN") : "—"}</Text>
          </View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <Text style={styles.fieldLabel}>Extra revision round fee (Rs.)</Text>
            <Text style={styles.fieldValue}>{revisionFee ? revisionFee.toLocaleString("en-IN") : "—"}</Text>
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.sigBox}>
            <Text style={{ fontWeight: 600 }}>For the Gym: name and signature</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 8, color: "#64748b" }}>Date</Text>
          </View>
          <View style={styles.sigBox}>
            <Text style={{ fontWeight: 600 }}>For The Story Builder: name and signature</Text>
            <View style={styles.sigLine} />
            <Text style={{ fontSize: 8, color: "#64748b" }}>Date</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>{branding?.company_name || "The Story Builder"} | GSTIN: {branding?.gstin || "N/A"}</Text>
          <Text>Content Services Agreement</Text>
        </View>
      </Page>
    </Document>
  );
}

export { PLAN_DETAILS };

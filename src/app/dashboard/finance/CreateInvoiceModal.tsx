"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createInvoice } from "@/app/actions/finance";

interface ClientOption {
  id: string;
  name: string;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
}

export default function CreateInvoiceModal({ isOpen, onClose, clients }: CreateInvoiceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function actionCreateInvoice(formData: FormData) {
    setFormError("");
    setSubmitting(true);
    
    try {
      const res = await createInvoice(formData);
      if (res?.error) {
        setFormError(res.error);
        setSubmitting(false);
        return;
      }
      
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
              <h3 className="text-white text-sm font-semibold uppercase tracking-wider">
                New Revenue Invoice
              </h3>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form action={actionCreateInvoice} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold block">Invoice Number</label>
                <input
                  type="text"
                  name="invoice_number"
                  required
                  placeholder="e.g. INV-2026-001"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold block">Select Client</label>
                <select
                  name="client_id"
                  required
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold block">Base Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    placeholder="e.g. 50000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold block">GST Amount (₹)</label>
                  <input
                    type="number"
                    name="gst_amount"
                    defaultValue="0"
                    placeholder="e.g. 9000"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold block">Issue Date</label>
                  <input
                    type="date"
                    name="issue_date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-neutral-400 font-semibold block">Due Date</label>
                  <input
                    type="date"
                    name="due_date"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold block">Initial Status</label>
                <select
                  name="status"
                  defaultValue="draft"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-neutral-700"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent (Unpaid)</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white-literal px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  {submitting ? "Creating..." : "Save Invoice"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

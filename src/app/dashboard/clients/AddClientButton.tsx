"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";

export default function AddClientButton({ 
  role 
}: { 
  role?: "owner" | "admin" | "manager" | "member" | "client";
}) {
  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    gst_number: "",
    contract_type: "project",
    monthly_retainer_value: "",
    start_date: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id, id")
      .eq("id", userData.user?.id)
      .single();

    const { error } = await supabase.from("clients").insert({
      org_id: profile?.org_id,
      name: form.name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      gst_number: form.gst_number || null,
      contract_type: form.contract_type,
      monthly_retainer_value: form.monthly_retainer_value
        ? Number(form.monthly_retainer_value)
        : 0,
      start_date: form.start_date || null,
      created_by: profile?.id,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setOpen(false);
    setLoading(false);
    setForm({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      gst_number: "",
      contract_type: "project",
      monthly_retainer_value: "",
      start_date: "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white-literal text-sm font-medium px-3.5 py-2 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Add Client
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Add Client</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                placeholder="Client / Business name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                placeholder="Contact person"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <input
                placeholder="GST Number (optional)"
                value={form.gst_number}
                onChange={(e) =>
                  setForm({ ...form, gst_number: e.target.value })
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className={isOwnerOrAdmin ? "" : "col-span-2"}>
                  <select
                    value={form.contract_type}
                    onChange={(e) =>
                      setForm({ ...form, contract_type: e.target.value })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="project">Project</option>
                    <option value="retainer">Retainer</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
                {isOwnerOrAdmin && (
                  <input
                    placeholder="Monthly value (₹)"
                    type="number"
                    value={form.monthly_retainer_value}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        monthly_retainer_value: e.target.value,
                      })
                    }
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({ ...form, start_date: e.target.value })
                }
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {error && (
                <p className="text-red-400 text-xs bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white-literal text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                {loading ? "Adding..." : "Add Client"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Trash2, X, Pencil } from "lucide-react";

type Client = {
  id: string;
  name: string;
  contact_person: string | null;
  phone?: string | null;
  email?: string | null;
  gst_number?: string | null;
  status: string;
  contract_type: string;
  monthly_retainer_value: number;
  start_date: string | null;
};

const statusColors: Record<string, string> = {
  active: "bg-green-950 text-green-400 border-green-900",
  paused: "bg-yellow-950 text-yellow-400 border-yellow-900",
  churned: "bg-neutral-800 text-neutral-500 border-neutral-700",
};

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    gst_number: "",
    contract_type: "project",
    monthly_retainer_value: "",
    start_date: "",
    status: "active",
  });

  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(clientId: string) {
    setLoadingId(clientId);
    setError(null);

    const { error: deleteError } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (deleteError) {
      setError(deleteError.message);
      setLoadingId(null);
      setConfirmDeleteId(null);
      return;
    }

    setConfirmDeleteId(null);
    setLoadingId(null);
    router.refresh();
  }

  function handleOpenEdit(client: Client) {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      contact_person: client.contact_person || "",
      phone: client.phone || "",
      email: client.email || "",
      gst_number: client.gst_number || "",
      contract_type: client.contract_type,
      monthly_retainer_value: client.monthly_retainer_value ? String(client.monthly_retainer_value) : "",
      start_date: client.start_date || "",
      status: client.status,
    });
    setError(null);
  }

  async function handleUpdateClient(e: React.FormEvent) {
    e.preventDefault();
    if (!editingClient) return;

    setEditLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        name: editForm.name,
        contact_person: editForm.contact_person || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        gst_number: editForm.gst_number || null,
        contract_type: editForm.contract_type,
        monthly_retainer_value: editForm.monthly_retainer_value ? Number(editForm.monthly_retainer_value) : 0,
        start_date: editForm.start_date || null,
        status: editForm.status,
      })
      .eq("id", editingClient.id);

    if (updateError) {
      setError(updateError.message);
      setEditLoading(false);
      return;
    }

    setEditingClient(null);
    setEditLoading(false);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-10 text-center">
        <p className="text-neutral-500 text-sm">
          No clients yet. Add your first one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && !editingClient && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>Error: {error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-left bg-neutral-950/20">
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs">
                Client
              </th>
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs">
                Contact
              </th>
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs">
                Type
              </th>
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs">
                Retainer (₹)
              </th>
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs">
                Status
              </th>
              <th className="px-5 py-3 text-neutral-500 font-medium text-xs text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30"
              >
                <td className="px-5 py-3 font-medium">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="text-white hover:text-indigo-400 transition-colors"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-neutral-400">
                  {client.contact_person || "—"}
                </td>
                <td className="px-5 py-3 text-neutral-400 capitalize">
                  {client.contract_type.replace("_", " ")}
                </td>
                <td className="px-5 py-3 text-neutral-400">
                  {client.monthly_retainer_value
                    ? `₹${Number(client.monthly_retainer_value).toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                      statusColors[client.status]
                    }`}
                  >
                    {client.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {confirmDeleteId === client.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-neutral-400">Are you sure?</span>
                      <button
                        onClick={() => handleDelete(client.id)}
                        disabled={loadingId === client.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/50 text-xs px-2 py-1 rounded border border-red-900/50 transition-colors font-medium"
                      >
                        {loadingId === client.id ? "..." : "Delete"}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={loadingId === client.id}
                        className="text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs px-2 py-1 rounded border border-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors"
                        title="Edit Client"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(client.id);
                          setError(null);
                        }}
                        className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800/50 transition-colors"
                        title="Delete Client"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT CLIENT MODAL */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
              <h2 className="text-white font-semibold">Edit Client: {editingClient.name}</h2>
              <button
                onClick={() => setEditingClient(null)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Business Name *
                </label>
                <input
                  required
                  placeholder="Client / Business name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={editLoading}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Contact Person
                </label>
                <input
                  placeholder="Contact person"
                  value={editForm.contact_person}
                  onChange={(e) =>
                    setEditForm({ ...editForm, contact_person: e.target.value })
                  }
                  disabled={editLoading}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Phone
                  </label>
                  <input
                    placeholder="Phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Email
                  </label>
                  <input
                    placeholder="Email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  GST Number
                </label>
                <input
                  placeholder="GST Number"
                  value={editForm.gst_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gst_number: e.target.value })
                  }
                  disabled={editLoading}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Contract Type
                  </label>
                  <select
                    value={editForm.contract_type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contract_type: e.target.value })
                    }
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="project">Project</option>
                    <option value="retainer">Retainer</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Retainer Value (₹)
                  </label>
                  <input
                    placeholder="Monthly value (₹)"
                    type="number"
                    value={editForm.monthly_retainer_value}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        monthly_retainer_value: e.target.value,
                      })
                    }
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    disabled={editLoading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
              >
                {editLoading ? "Saving client..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

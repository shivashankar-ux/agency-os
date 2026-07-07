"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Trash2, X, AlertCircle, ShieldAlert } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member" | "client";
  job_title: string | null;
  is_active: boolean;
};

export default function TeamListClient({
  team,
  currentProfile,
}: {
  team: Profile[];
  currentProfile: Profile;
}) {
  const router = useRouter();
  const supabase = createClient();

  // Modals state
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [deletingMember, setDeletingMember] = useState<Profile | null>(null);

  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    role: "member" as "admin" | "manager" | "member" | "client",
    job_title: "",
    is_active: true,
  });

  function handleOpenEdit(member: Profile) {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      role: member.role === "owner" ? "member" : member.role,
      job_title: member.job_title || "",
      is_active: member.is_active,
    });
    setError(null);
  }

  async function handleUpdateMember(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: editForm.name,
        role: editForm.role,
        job_title: editForm.job_title || null,
        is_active: editForm.is_active,
      })
      .eq("id", editingMember.id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setEditingMember(null);
    setLoading(false);
    router.refresh();
  }

  async function handleDeleteMember() {
    if (!deletingMember) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/delete-team-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: deletingMember.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete team member");
      }

      setDeletingMember(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during deletion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Team List Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl divide-y divide-neutral-800">
        {team.map((member) => (
          <div key={member.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-medium">{member.name}</p>
                {member.job_title && (
                  <span className="text-xxs px-1.5 py-0.2 rounded bg-neutral-800 border border-neutral-750 text-neutral-400 capitalize">
                    {member.job_title}
                  </span>
                )}
                {!member.is_active && (
                  <span className="text-xxs px-1.5 py-0.2 rounded bg-red-950 border border-red-900 text-red-400 font-semibold uppercase">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-xs mt-0.5">{member.email}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs px-2 py-0.5 rounded-full border border-indigo-800 bg-indigo-950 text-indigo-400 capitalize">
                {member.role}
              </span>

              {/* Owner edit and delete tools - blocked on Owner's own profile */}
              {member.id !== currentProfile.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(member)}
                    className="text-neutral-500 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Edit Team Member"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingMember(member);
                      setError(null);
                    }}
                    className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                    title="Delete Team Member"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ) : (
                <div className="w-16" /> /* Spacing block to keep layout aligned */
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: EDIT TEAM MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-base">Edit Team Member</h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Full Name *</label>
                <input
                  required
                  placeholder="e.g. Jane Doe"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={loading}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Role *</label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as "admin" | "manager" | "member" | "client" })
                    }
                    disabled={loading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Job Title</label>
                  <input
                    placeholder="e.g. Visual Designer"
                    value={editForm.job_title}
                    onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
                    disabled={loading}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* is_active Checkbox / Toggle */}
              <div className="flex items-center gap-2 p-2 rounded-lg border border-neutral-800 bg-neutral-950/40">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  disabled={loading}
                  className="accent-indigo-500 rounded"
                />
                <label
                  htmlFor="is_active_toggle"
                  className="text-xs text-neutral-350 cursor-pointer select-none"
                >
                  Account Active (Unchecking blocks this user from accessing the dashboard)
                </label>
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
              >
                {loading ? "Updating member..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE TEAM MEMBER WARNING */}
      {deletingMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-red-400 font-semibold text-base flex items-center gap-1.5">
                <ShieldAlert size={18} />
                Delete Team Member
              </h2>
              <button
                onClick={() => setDeletingMember(null)}
                className="text-neutral-500 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-neutral-350 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">{deletingMember.name}</strong>? 
              </p>
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg text-xs text-red-400 leading-relaxed">
                <strong>Warning:</strong> This action cannot be undone. It will completely revoke their access and delete their user profile. Any tasks currently assigned to them will be unassigned automatically.
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingMember(null)}
                  disabled={loading}
                  className="flex-1 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 text-sm font-medium rounded-lg py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteMember}
                  disabled={loading}
                  className="flex-1 bg-red-650 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
                >
                  {loading ? "Deleting..." : "Delete Member"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

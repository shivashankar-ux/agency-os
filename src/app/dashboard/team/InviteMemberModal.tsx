"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, UserPlus, AlertCircle, Copy, Check } from "lucide-react";

export default function InviteMemberModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state tracking
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "member", // default role
    job_title: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessLink(null);
    setEmailError(null);

    try {
      const response = await fetch("/api/invite-team-member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to invite team member");
      }

      // Success
      setSuccessLink(data.inviteLink || null);
      setEmailSent(data.emailSent ?? true);
      setEmailError(data.emailError || null);
      
      // Clean up form variables
      setForm({
        name: "",
        email: "",
        role: "member",
        job_title: "",
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleCloseSuccess() {
    setOpen(false);
    setSuccessLink(null);
    setEmailError(null);
    setCopied(false);
    router.refresh();
  }

  const handleCopyLink = () => {
    if (!successLink) return;
    navigator.clipboard.writeText(successLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccessLink(null);
        }}
        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <UserPlus size={16} />
        Invite Member
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md p-6">
            
            {/* Conditional Render: Success Screen */}
            {successLink ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <h2 className="text-white font-semibold text-base">Teammate Added</h2>
                  <button
                    onClick={handleCloseSuccess}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    User account has been successfully created in database.
                  </p>

                  {emailSent ? (
                    <div className="p-3 bg-green-950/30 border border-green-900/60 rounded-lg text-xs text-green-400">
                      An invitation email has been sent successfully via Resend.
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-950/30 border border-yellow-900/60 rounded-lg text-xs text-yellow-400 leading-relaxed">
                      <strong>Email Delivery Warning:</strong> {emailError || "Could not deliver email."} You can copy the setup URL below to onboard the user manually.
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                      Setup Password Link (URL)
                    </label>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={successLink}
                        className="flex-1 bg-neutral-950 border border-neutral-850 rounded-lg px-3 py-2 text-neutral-400 text-xs truncate focus:outline-none"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCloseSuccess}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
                >
                  Close & Refresh
                </button>
              </div>
            ) : (
              /* Invitation Form */
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-base">Invite Team Member</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-neutral-500 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Full Name *</label>
                    <input
                      required
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={loading}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Email Address *</label>
                    <input
                      required
                      type="email"
                      placeholder="e.g. john@agency.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={loading}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">Role *</label>
                      <select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
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
                        placeholder="e.g. SEO Lead"
                        value={form.job_title}
                        onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                        disabled={loading}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
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
                    {loading ? "Sending invitation..." : "Send Invitation"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

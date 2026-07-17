"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function AcceptInviteForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionEstablished, setSessionEstablished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read access_token and refresh_token from URL hash or query params
    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    const params = new URLSearchParams(hash || search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ data, error }) => {
          if (error) {
            setError("Failed to validate invitation: " + error.message);
          } else if (data.session) {
            setSessionEstablished(true);
          } else {
            setError("No active session found. The invite link may have expired.");
          }
          setSessionLoading(false);
        })
        .catch((err) => {
          setError(err.message || "An unexpected error occurred.");
          setSessionLoading(false);
        });
    } else {
      setError("Invalid or expired invitation link. Please request a new invite.");
      setSessionLoading(false);
    }
  }, [supabase]);

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Redirect to dashboard on success
    router.push("/dashboard");
    router.refresh();
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-4 text-center">
            <h1 className="text-2xl font-semibold text-white tracking-tight animate-pulse">
              Verifying Invitation
            </h1>
            <p className="text-neutral-500 text-sm mt-2">Connecting to secure session...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Welcome to the Team
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Set your account password to get started</p>
        </div>

        {sessionEstablished ? (
          <form
            onSubmit={handleSetPassword}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

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
              {loading ? "Setting password..." : "Set Password"}
            </button>
          </form>
        ) : (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-center space-y-4">
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-4 py-3">
              {error || "Invalid invitation link."}
            </p>
            <p className="text-neutral-500 text-xs">
              Please check if you copied the link completely, or contact the owner for a new invitation.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline mt-2 block w-full text-center"
            >
              Go to Login Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}

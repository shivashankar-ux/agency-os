"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Save, AlertCircle, CheckCircle } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "member";
  job_title: string | null;
};

type Permission = {
  id: string;
  user_id: string;
  feature_key: string;
  can_view: boolean;
  can_edit: boolean;
};

const features = [
  { key: "finance", label: "Finance", desc: "Access invoices and expenses" },
  { key: "all_clients", label: "All Clients", desc: "View all clients without explicit assignment" },
  { key: "team_management", label: "Team Management", desc: "Access team member roles and list" },
];

export default function PermissionsToggleList({
  team,
  initialPermissions,
}: {
  team: Profile[];
  initialPermissions: Permission[];
}) {
  const supabase = createClient();

  // Store permissions in a state object keyed by `userId_featureKey` for O(1) lookups and easy updates
  const [permissionsMap, setPermissionsMap] = useState<Record<string, { can_view: boolean; can_edit: boolean }>>(() => {
    const map: Record<string, { can_view: boolean; can_edit: boolean }> = {};
    
    // Initialize map with fetched permissions
    initialPermissions.forEach((perm) => {
      map[`${perm.user_id}_${perm.feature_key}`] = {
        can_view: perm.can_view,
        can_edit: perm.can_edit,
      };
    });

    // Backfill any missing entries with defaults
    team.forEach((member) => {
      features.forEach((feature) => {
        const key = `${member.id}_${feature.key}`;
        if (!map[key]) {
          map[key] = { can_view: false, can_edit: false };
        }
      });
    });

    return map;
  });

  // Track save status for visual feedback per row/cell
  // Status: null | 'saving' | 'saved' | 'error'
  const [saveStatus, setSaveStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleToggle(
    userId: string,
    featureKey: string,
    type: "view" | "edit",
    currentVal: boolean
  ) {
    const key = `${userId}_${featureKey}`;
    const currentPerm = permissionsMap[key] || { can_view: false, can_edit: false };
    
    let nextView = currentPerm.can_view;
    let nextEdit = currentPerm.can_edit;

    if (type === "view") {
      nextView = !currentVal;
      // If view is disabled, edit must also be disabled
      if (!nextView) {
        nextEdit = false;
      }
    } else {
      nextEdit = !currentVal;
      // If edit is enabled, view must also be enabled
      if (nextEdit) {
        nextView = true;
      }
    }

    // Proactively update local UI state
    setPermissionsMap((prev) => ({
      ...prev,
      [key]: { can_view: nextView, can_edit: nextEdit },
    }));

    // Trigger Supabase upsert
    setSaveStatus((prev) => ({ ...prev, [key]: "saving" }));
    setErrorMsg(null);

    const { error } = await supabase
      .from("permissions")
      .upsert(
        {
          user_id: userId,
          feature_key: featureKey,
          can_view: nextView,
          can_edit: nextEdit,
        },
        { onConflict: "user_id,feature_key" }
      );

    if (error) {
      // Revert UI state on error
      setPermissionsMap((prev) => ({ ...prev, [key]: currentPerm }));
      setSaveStatus((prev) => ({ ...prev, [key]: "error" }));
      setErrorMsg(`Failed to save permission: ${error.message}`);
    } else {
      setSaveStatus((prev) => ({ ...prev, [key]: "saved" }));
      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSaveStatus((prev) => {
          const next = { ...prev };
          if (next[key] === "saved") {
            delete next[key];
          }
          return next;
        });
      }, 2000);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/team"
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Team
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Permissions Grid Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
        {team.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 text-sm">
            No team members available to manage.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-left bg-neutral-950/40">
                <th className="px-5 py-4 text-neutral-500 font-medium text-xs w-1/4">
                  Team Member
                </th>
                {features.map((f) => (
                  <th key={f.key} className="px-5 py-4 text-neutral-500 font-medium text-xs w-1/4 text-center">
                    {f.label}
                    <span className="block text-xxs font-normal text-neutral-600 mt-0.5 max-w-[200px] mx-auto">
                      {f.desc}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-neutral-850/10">
                  <td className="px-5 py-4">
                    <p className="text-white font-medium text-sm">{member.name}</p>
                    <p className="text-neutral-500 text-xs mt-0.5">{member.email}</p>
                    {member.job_title && (
                      <span className="text-xxs text-indigo-400 bg-indigo-950/40 border border-indigo-900/50 px-1.5 py-0.5 rounded mt-1.5 inline-block">
                        {member.job_title}
                      </span>
                    )}
                  </td>

                  {features.map((f) => {
                    const key = `${member.id}_${f.key}`;
                    const perm = permissionsMap[key] || { can_view: false, can_edit: false };
                    const status = saveStatus[key];

                    return (
                      <td key={f.key} className="px-5 py-4">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="flex items-center gap-4 text-xs">
                            {/* View Toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none text-neutral-300">
                              <input
                                type="checkbox"
                                checked={perm.can_view}
                                onChange={() => handleToggle(member.id, f.key, "view", perm.can_view)}
                                className="accent-indigo-500 rounded"
                              />
                              <span>View</span>
                            </label>

                            {/* Edit Toggle */}
                            <label className="flex items-center gap-1.5 cursor-pointer select-none text-neutral-300">
                              <input
                                type="checkbox"
                                checked={perm.can_edit}
                                onChange={() => handleToggle(member.id, f.key, "edit", perm.can_edit)}
                                className="accent-indigo-500 rounded"
                              />
                              <span>Edit</span>
                            </label>
                          </div>

                          {/* Individual save indicator */}
                          <div className="h-4 flex items-center justify-center">
                            {status === "saving" && (
                              <span className="text-xxs text-neutral-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-ping" />
                                Saving...
                              </span>
                            )}
                            {status === "saved" && (
                              <span className="text-xxs text-green-400 flex items-center gap-0.5 font-medium">
                                <CheckCircle size={10} />
                                Saved
                              </span>
                            )}
                            {status === "error" && (
                              <span className="text-xxs text-red-400 font-medium">
                                Error
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

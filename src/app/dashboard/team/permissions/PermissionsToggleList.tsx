"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ROLE_DEFAULTS, getEmptyPermissionMap, PermissionMap, PermissionScope } from "@/lib/permissions-base";
import { ArrowLeft, Save, AlertCircle, CheckCircle, Search, RefreshCw, Copy, Shield, ShieldAlert, Check } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member";
  job_title: string | null;
};

type DbPermission = {
  user_id: string;
  module: string;
  action: string;
  scope: string;
};

interface PermissionDef {
  action: string;
  label: string;
  hasScope?: boolean;
}

const MODULE_DEFS: Record<string, { label: string; permissions: PermissionDef[] }> = {
  clients: {
    label: "Clients Management",
    permissions: [
      { action: "view", label: "View Clients list", hasScope: true },
      { action: "create", label: "Create / Add Client" },
      { action: "edit", label: "Edit Client Details" },
      { action: "delete", label: "Delete / Churn Client" },
      { action: "export", label: "Export Clients Data" },
    ],
  },
  projects: {
    label: "Projects Management",
    permissions: [
      { action: "view", label: "View Projects list", hasScope: true },
      { action: "create", label: "Create Project" },
      { action: "edit", label: "Edit Project Details" },
      { action: "archive", label: "Archive Project" },
      { action: "delete", label: "Delete Project" },
    ],
  },
  tasks: {
    label: "Tasks Management",
    permissions: [
      { action: "view", label: "View Tasks board", hasScope: true },
      { action: "assign", label: "Assign Tasks to Team" },
      { action: "create", label: "Create Task" },
      { action: "complete", label: "Mark Task Complete" },
      { action: "delete", label: "Delete Task" },
    ],
  },
  team: {
    label: "Team Management",
    permissions: [
      { action: "view", label: "View Team Members" },
      { action: "invite", label: "Invite Team Member" },
      { action: "remove", label: "Remove / Deactivate Member" },
      { action: "change_roles", label: "Change Member Roles" },
    ],
  },
  dashboard: {
    label: "Dashboard Widgets",
    permissions: [
      { action: "view_revenue", label: "Show Revenue Analytics" },
      { action: "view_analytics", label: "Show operational charts" },
      { action: "view_kpis", label: "Show Operations KPIs" },
      { action: "view_financial_cards", label: "Show Invoice summary cards" },
      { action: "view_team_performance", label: "Show Team Performance Leaderboard" },
    ],
  },
  reports: {
    label: "Reports & Audits",
    permissions: [
      { action: "view", label: "Access reports analytics page" },
      { action: "export", label: "Export custom excel reports" },
    ],
  },
  finance: {
    label: "Finance Hub",
    permissions: [
      { action: "view", label: "Access invoice & finance tab" },
      { action: "create_invoice", label: "Generate invoices" },
      { action: "edit_invoice", label: "Edit invoice status / amount" },
      { action: "expenses", label: "Track company expenses" },
      { action: "revenue", label: "View absolute revenue streams" },
      { action: "profit", label: "View margin calculations" },
    ],
  },
  files: {
    label: "File Storage & Cloud",
    permissions: [
      { action: "upload", label: "Upload Documents" },
      { action: "download", label: "Download Folders" },
      { action: "delete", label: "Delete Uploaded Files" },
    ],
  },
  ai: {
    label: "AI Platform Tools",
    permissions: [
      { action: "proposal_generator", label: "AI Business Proposals" },
      { action: "marketing_ai", label: "AI Marketing Copy generator" },
      { action: "caption_generator", label: "AI Caption creator" },
      { action: "reports_ai", label: "AI Reports insights analyser" },
    ],
  },
  settings: {
    label: "Workspace Settings",
    permissions: [
      { action: "company_settings", label: "Manage settings panel" },
      { action: "branding", label: "Manage branding logo & styling" },
      { action: "integrations", label: "Configure App Integrations" },
    ],
  },
};

export default function PermissionsToggleList({
  team,
  initialPermissions,
}: {
  team: Profile[];
  initialPermissions: DbPermission[];
}) {
  const router = useRouter();
  const supabase = createClient();

  // Sidebar search filter for members list
  const [memberSearch, setMemberSearch] = useState("");

  // Selected User state
  const [selectedUser, setSelectedUser] = useState<Profile | null>(() => team[0] || null);

  // Search filter for permissions configurations
  const [permSearch, setPermSearch] = useState("");

  // Local state holding the list of all permissions overrides
  const [dbOverrides, setDbOverrides] = useState<DbPermission[]>(initialPermissions);

  // Tracking saving status
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clone from user state
  const [cloneSourceId, setCloneSourceId] = useState("");

  // Check if selected user currently has custom overrides enabled
  const selectedUserHasCustom = useMemo(() => {
    if (!selectedUser) return false;
    return dbOverrides.some(
      (perm) => perm.user_id === selectedUser.id && perm.module === "_core" && perm.action === "custom"
    );
  }, [dbOverrides, selectedUser]);

  // Draft permissions map for the selected user
  const [draftPermissions, setDraftPermissions] = useState<PermissionMap>(() => {
    return getEmptyPermissionMap();
  });

  // Whenever selected user changes, load their overrides or role defaults
  useMemo(() => {
    if (!selectedUser) return;
    
    const userOverrides = dbOverrides.filter((p) => p.user_id === selectedUser.id);
    const hasCustom = userOverrides.some((ov) => ov.module === "_core" && ov.action === "custom");

    let finalMap = getEmptyPermissionMap();

    if (hasCustom) {
      // Load custom overrides from state
      userOverrides.forEach((ov) => {
        if (ov.module !== "_core" && finalMap[ov.module]) {
          finalMap[ov.module][ov.action] = {
            allowed: true,
            scope: ov.scope as PermissionScope,
          };
        }
      });
    } else {
      // Use role default settings
      const defaults = ROLE_DEFAULTS[selectedUser.role] || ROLE_DEFAULTS.member;
      finalMap = JSON.parse(JSON.stringify(defaults));
    }

    setDraftPermissions(finalMap);
    setErrorMsg(null);
    setSaveSuccess(false);
  }, [selectedUser, dbOverrides]);

  // Filter team members list
  const filteredTeam = useMemo(() => {
    return team.filter(
      (m) =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.job_title && m.job_title.toLowerCase().includes(memberSearch.toLowerCase()))
    );
  }, [team, memberSearch]);

  // Filter modules/permissions based on permission search keyword
  const filteredModuleDefs = useMemo(() => {
    if (!permSearch.trim()) return MODULE_DEFS;

    const query = permSearch.toLowerCase();
    const result: typeof MODULE_DEFS = {};

    for (const key in MODULE_DEFS) {
      const mod = MODULE_DEFS[key];
      const matchingPerms = mod.permissions.filter(
        (p) => p.label.toLowerCase().includes(query) || p.action.toLowerCase().includes(query)
      );

      if (matchingPerms.length > 0 || mod.label.toLowerCase().includes(query)) {
        result[key] = {
          label: mod.label,
          permissions: matchingPerms.length > 0 ? matchingPerms : mod.permissions,
        };
      }
    }
    return result;
  }, [permSearch]);

  // Enable/Disable Custom Overrides switch
  function handleCustomToggle(enable: boolean) {
    if (!selectedUser) return;

    if (enable) {
      // Enable Custom Overrides: Load role defaults into drafts, but lock local state
      const defaults = ROLE_DEFAULTS[selectedUser.role] || ROLE_DEFAULTS.member;
      setDraftPermissions(JSON.parse(JSON.stringify(defaults)));
      
      // Update local override list to contain _core flag so UI renders customized fields
      const newOverrideFlag: DbPermission = {
        user_id: selectedUser.id,
        module: "_core",
        action: "custom",
        scope: "all",
      };
      setDbOverrides((prev) => [...prev.filter((p) => p.user_id !== selectedUser.id), newOverrideFlag]);
    } else {
      // Revert/Disable Custom Overrides: Remove all custom rows for this user
      setDbOverrides((prev) => prev.filter((p) => p.user_id !== selectedUser.id));
      // Reset drafts back to role defaults
      const defaults = ROLE_DEFAULTS[selectedUser.role] || ROLE_DEFAULTS.member;
      setDraftPermissions(JSON.parse(JSON.stringify(defaults)));
    }
  }

  // Toggle single action checkbox
  function handleCheckboxChange(moduleKey: string, actionKey: string, checked: boolean) {
    setDraftPermissions((prev) => {
      const updated = { ...prev };
      if (updated[moduleKey] && updated[moduleKey][actionKey]) {
        updated[moduleKey][actionKey].allowed = checked;
      }
      return updated;
    });
  }

  // Handle visibility scope change
  function handleScopeChange(moduleKey: string, actionKey: string, scope: PermissionScope) {
    setDraftPermissions((prev) => {
      const updated = { ...prev };
      if (updated[moduleKey] && updated[moduleKey][actionKey]) {
        updated[moduleKey][actionKey].scope = scope;
      }
      return updated;
    });
  }

  // Save current drafts to Database
  async function handleSave() {
    if (!selectedUser) return;
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      // Delete existing overrides for this user
      const { error: deleteError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", selectedUser.id);

      if (deleteError) throw deleteError;

      const rowsToInsert: DbPermission[] = [];

      if (selectedUserHasCustom) {
        // Core custom flag row
        rowsToInsert.push({
          user_id: selectedUser.id,
          module: "_core",
          action: "custom",
          scope: "all",
        });

        // Add permitted actions rows
        for (const modKey in draftPermissions) {
          for (const actKey in draftPermissions[modKey]) {
            const check = draftPermissions[modKey][actKey];
            if (check.allowed) {
              rowsToInsert.push({
                user_id: selectedUser.id,
                module: modKey,
                action: actKey,
                scope: check.scope,
              });
            }
          }
        }

        if (rowsToInsert.length > 1) {
          const { error: insertError } = await supabase
            .from("user_permissions")
            .insert(rowsToInsert);

          if (insertError) throw insertError;
        }
      }

      // Update local dbOverrides state
      setDbOverrides((prev) => [
        ...prev.filter((p) => p.user_id !== selectedUser.id),
        ...rowsToInsert,
      ]);

      setSaveSuccess(true);
      router.refresh();

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  }

  // Clone/Copy permissions from another user
  function handleClone() {
    if (!cloneSourceId || !selectedUser) return;
    
    // Find overrides of source user
    const sourceOverrides = dbOverrides.filter((p) => p.user_id === cloneSourceId);
    const hasCustom = sourceOverrides.some((ov) => ov.module === "_core" && ov.action === "custom");

    let sourceMap = getEmptyPermissionMap();

    if (hasCustom) {
      sourceOverrides.forEach((ov) => {
        if (ov.module !== "_core" && sourceMap[ov.module]) {
          sourceMap[ov.module][ov.action] = {
            allowed: true,
            scope: ov.scope as PermissionScope,
          };
        }
      });
    } else {
      const sourceUser = team.find((t) => t.id === cloneSourceId);
      if (sourceUser) {
        const defaults = ROLE_DEFAULTS[sourceUser.role] || ROLE_DEFAULTS.member;
        sourceMap = JSON.parse(JSON.stringify(defaults));
      }
    }

    setDraftPermissions(sourceMap);
    
    // Proactively mark selected user as customized locally
    if (!selectedUserHasCustom) {
      const newOverrideFlag: DbPermission = {
        user_id: selectedUser.id,
        module: "_core",
        action: "custom",
        scope: "all",
      };
      setDbOverrides((prev) => [...prev.filter((p) => p.user_id !== selectedUser.id), newOverrideFlag]);
    }

    setCloneSourceId("");
  }

  // Reset current selections
  function handleReset() {
    if (!selectedUser) return;
    // Re-resolve starting map
    const userOverrides = dbOverrides.filter((p) => p.user_id === selectedUser.id);
    const hasCustom = userOverrides.some((ov) => ov.module === "_core" && ov.action === "custom");
    let defaults = getEmptyPermissionMap();

    if (hasCustom) {
      userOverrides.forEach((ov) => {
        if (ov.module !== "_core" && defaults[ov.module]) {
          defaults[ov.module][ov.action] = {
            allowed: true,
            scope: ov.scope as PermissionScope,
          };
        }
      });
    } else {
      const rDefaults = ROLE_DEFAULTS[selectedUser.role] || ROLE_DEFAULTS.member;
      defaults = JSON.parse(JSON.stringify(rDefaults));
    }
    setDraftPermissions(defaults);
    setErrorMsg(null);
  }

  return (
    <div className="space-y-4">
      {/* Top Gating Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/team"
          className="flex items-center gap-1.5 text-neutral-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Team members
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Console Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Member Selection sidebar list (4 cols) */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[700px]">
          <div className="p-4 border-b border-neutral-800 bg-neutral-950/40">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-neutral-500">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search team member..."
                className="w-full bg-neutral-850 border border-neutral-850 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/50">
            {filteredTeam.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                No team members found.
              </div>
            ) : (
              filteredTeam.map((member) => {
                const isSelected = selectedUser?.id === member.id;
                const isCustomized = dbOverrides.some(
                  (p) => p.user_id === member.id && p.module === "_core" && p.action === "custom"
                );

                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUser(member)}
                    className={`w-full text-left p-4 transition-all flex items-start justify-between gap-2 border-l-2 ${
                      isSelected
                        ? "bg-indigo-600/10 border-indigo-500"
                        : "hover:bg-neutral-850/30 border-transparent"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${isSelected ? "text-white" : "text-neutral-300"}`}>
                        {member.name}
                      </p>
                      <p className="text-neutral-500 text-xs truncate mt-0.5">{member.email}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xxs text-neutral-400 capitalize px-1.5 py-0.5 bg-neutral-800 rounded">
                          {member.role}
                        </span>
                        {member.job_title && (
                          <span className="text-xxs text-neutral-500 italic max-w-[120px] truncate">
                            {member.job_title}
                          </span>
                        )}
                      </div>
                    </div>
                    {isCustomized && (
                      <span className="shrink-0 text-xxs font-medium text-indigo-400 border border-indigo-900 bg-indigo-950/40 px-1 rounded flex items-center gap-0.5">
                        <Shield size={10} />
                        Custom
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Permissions configurations controller panel (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedUser ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[700px]">
              
              {/* Card top banner header */}
              <div className="p-5 border-b border-neutral-800 bg-neutral-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-white text-base font-bold flex items-center gap-2">
                    {selectedUser.name}
                    <span className="text-xs font-normal text-neutral-500">
                      ({selectedUser.email})
                    </span>
                  </h2>
                  <p className="text-neutral-500 text-xs mt-1">
                    Job Title: <span className="text-neutral-400 font-semibold">{selectedUser.job_title || "None"}</span> | System Role: <span className="text-neutral-400 font-semibold capitalize">{selectedUser.role}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Clone select utility */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={cloneSourceId}
                      onChange={(e) => setCloneSourceId(e.target.value)}
                      className="bg-neutral-800 border border-neutral-750 text-neutral-300 text-xxs rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Clone permissions from...</option>
                      {team
                        .filter((t) => t.id !== selectedUser.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.role})
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={handleClone}
                      disabled={!cloneSourceId}
                      className="p-1.5 rounded bg-neutral-800 border border-neutral-750 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-300 transition-colors text-xxs font-medium flex items-center gap-1"
                      title="Clone selected user's permissions"
                    >
                      <Copy size={12} />
                      Clone
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-header controls block */}
              <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                
                {/* Active Toggle Switch */}
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className={selectedUserHasCustom ? "text-indigo-400" : "text-neutral-600"} />
                  <span className="text-neutral-300 font-medium">Custom Overrides:</span>
                  <button
                    onClick={() => handleCustomToggle(!selectedUserHasCustom)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      selectedUserHasCustom ? "bg-indigo-600" : "bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        selectedUserHasCustom ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-neutral-500 font-medium">
                    {selectedUserHasCustom ? "Custom overrides active" : "Inheriting static defaults"}
                  </span>
                </div>

                {/* Filter search box for permissions */}
                <div className="relative w-full sm:w-48">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-neutral-500">
                    <Search size={12} />
                  </span>
                  <input
                    type="text"
                    value={permSearch}
                    onChange={(e) => setPermSearch(e.target.value)}
                    placeholder="Search permissions..."
                    className="w-full bg-neutral-800 border border-neutral-750 rounded py-1 pl-7 pr-2 text-xxs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Configurable body layout list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Display role warnings */}
                {!selectedUserHasCustom && (
                  <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-3 flex gap-2.5 text-indigo-400 leading-relaxed text-xxs">
                    <Shield size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white">System Defaults Active</p>
                      <p className="mt-0.5 text-neutral-400">
                        This user is operating under static role defaults for a <span className="capitalize text-indigo-300 font-medium">{selectedUser.role}</span>. Toggle "Custom Overrides" above to edit permissions individually.
                      </p>
                    </div>
                  </div>
                )}

                {/* Module groups checklist */}
                <div className="space-y-4">
                  {Object.keys(filteredModuleDefs).length === 0 ? (
                    <div className="text-center text-neutral-500 text-xs py-8">
                      No permissions match your search query.
                    </div>
                  ) : (
                    Object.keys(filteredModuleDefs).map((modKey) => {
                      const mod = filteredModuleDefs[modKey];

                      return (
                        <div
                          key={modKey}
                          className="bg-neutral-950/20 border border-neutral-800/80 rounded-xl p-4 space-y-3"
                        >
                          <h3 className="text-xs font-bold text-neutral-300 border-b border-neutral-800 pb-1.5 capitalize">
                            {mod.label}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {mod.permissions.map((p) => {
                              const draftCheck = draftPermissions[modKey]?.[p.action] || {
                                allowed: false,
                                scope: "all",
                              };

                              return (
                                <div
                                  key={p.action}
                                  className={`flex items-start justify-between gap-3 p-2 rounded-lg border transition-all ${
                                    draftCheck.allowed
                                      ? "bg-neutral-900/60 border-neutral-850"
                                      : "border-transparent opacity-60"
                                  }`}
                                >
                                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-neutral-300 min-w-0 flex-1 py-0.5">
                                    <input
                                      type="checkbox"
                                      checked={draftCheck.allowed}
                                      disabled={!selectedUserHasCustom}
                                      onChange={(e) =>
                                        handleCheckboxChange(modKey, p.action, e.target.checked)
                                      }
                                      className="accent-indigo-500 rounded shrink-0 mt-0.5"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-xxs font-medium block truncate text-neutral-200">
                                        {p.label}
                                      </span>
                                      <span className="text-[10px] text-neutral-500 block truncate">
                                        {p.action}
                                      </span>
                                    </div>
                                  </label>

                                  {/* Scope Dropdown selection */}
                                  {p.hasScope && (
                                    <select
                                      value={draftCheck.scope}
                                      disabled={!selectedUserHasCustom || !draftCheck.allowed}
                                      onChange={(e) =>
                                        handleScopeChange(
                                          modKey,
                                          p.action,
                                          e.target.value as PermissionScope
                                        )
                                      }
                                      className="bg-neutral-850 border border-neutral-750 text-[10px] text-neutral-400 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                                    >
                                      <option value="own">Own Data</option>
                                      <option value="team">Assigned Team</option>
                                      <option value="all">Entire Workspace</option>
                                    </select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  disabled={!selectedUserHasCustom || saving}
                  className="px-3 py-1.5 rounded-lg border border-neutral-850 hover:bg-neutral-850 text-neutral-400 hover:text-white disabled:opacity-40 transition-colors text-xs flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  Reset Edits
                </button>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-green-400 text-xxs font-semibold flex items-center gap-1 bg-green-950/40 border border-green-900/60 px-2.5 py-1 rounded-lg">
                      <Check size={12} />
                      Changes Saved Successfully
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 px-4 py-1.5 rounded-lg text-white font-medium text-xs flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving Config...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Permissions
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-500 text-sm h-[700px] flex items-center justify-center">
              Please select a user to configure permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

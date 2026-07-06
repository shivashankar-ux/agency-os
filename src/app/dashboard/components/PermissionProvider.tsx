"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_DEFAULTS, PermissionMap, PermissionScope } from "@/lib/permissions-base";

interface PermissionContextType {
  permissions: PermissionMap | null;
  loading: boolean;
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canExport: (module: string) => boolean;
  hasPermission: (module: string, action: string) => boolean;
  getScope: (module: string, action: string) => PermissionScope;
  userRole: string | null;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<PermissionMap | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // 1. Fetch user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role || "member";
        setUserRole(role);

        // 2. Fetch overrides
        const { data: overrides } = await supabase
          .from("user_permissions")
          .select("module, action, scope")
          .eq("user_id", user.id);

        // 3. Resolve permissions
        const defaults = JSON.parse(JSON.stringify(ROLE_DEFAULTS[role] || ROLE_DEFAULTS.member));
        if (overrides) {
          overrides.forEach((ov) => {
            if (defaults[ov.module]) {
              defaults[ov.module][ov.action] = {
                allowed: true,
                scope: ov.scope as PermissionScope,
              };
            }
          });
        }

        setPermissions(defaults);
      } catch (err) {
        console.error("Error loading permissions in client provider:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, []);

  const hasPermission = (module: string, action: string): boolean => {
    if (!permissions) return false;
    return permissions[module]?.[action]?.allowed || false;
  };

  const getScope = (module: string, action: string): PermissionScope => {
    if (!permissions) return "own";
    return permissions[module]?.[action]?.scope || "own";
  };

  const canView = (module: string) => hasPermission(module, "view");
  const canCreate = (module: string) => hasPermission(module, "create") || hasPermission(module, "add");
  const canEdit = (module: string) => hasPermission(module, "edit");
  const canDelete = (module: string) => hasPermission(module, "delete");
  const canExport = (module: string) => hasPermission(module, "export");

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        loading,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canExport,
        hasPermission,
        getScope,
        userRole,
      }}
    >
      {loading ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-neutral-500 text-xs font-semibold">Authorizing account...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}

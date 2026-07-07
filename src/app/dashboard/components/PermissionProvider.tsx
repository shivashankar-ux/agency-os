"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PermissionMap, PermissionScope } from "@/lib/permissions-base";

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

export function PermissionProvider({ 
  children,
  initialPermissions,
  initialRole,
}: { 
  children: ReactNode;
  initialPermissions: PermissionMap;
  initialRole: string;
}) {
  const [permissions] = useState<PermissionMap>(initialPermissions);
  const [userRole] = useState<string>(initialRole);

  const hasPermission = (module: string, action: string): boolean => {
    return permissions[module]?.[action]?.allowed || false;
  };

  const getScope = (module: string, action: string): PermissionScope => {
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
        loading: false,
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
      {children}
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

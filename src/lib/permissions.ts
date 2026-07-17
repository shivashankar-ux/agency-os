import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { 
  ROLE_DEFAULTS, 
  getEmptyPermissionMap, 
  PermissionMap, 
  PermissionScope, 
  PermissionCheck 
} from "./permissions-base";

export type { PermissionMap, PermissionScope, PermissionCheck };
export { ROLE_DEFAULTS, getEmptyPermissionMap };

// Central permissions resolver
export const getPermissions = cache(async (userId: string): Promise<PermissionMap> => {
  const supabase = await createClient();

  // 1. Fetch profile to resolve user's base role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    console.error("Failed to load user profile for permissions check:", profileError);
    return ROLE_DEFAULTS.member; // Fallback to employee/member defaults
  }

  const role = profile.role || "member";
  const defaults = JSON.parse(JSON.stringify(ROLE_DEFAULTS[role] || ROLE_DEFAULTS.member));

  // Helper to force finance permissions to false for non-owner and non-admin
  const enforceFinanceGating = (map: PermissionMap) => {
    if (role !== "owner") {
      if (map.finance) {
        for (const action in map.finance) {
          map.finance[action] = { allowed: false, scope: "own" };
        }
      }
      if (map.dashboard) {
        if (map.dashboard.view_revenue) {
          map.dashboard.view_revenue = { allowed: false, scope: "own" };
        }
        if (map.dashboard.view_financial_cards) {
          map.dashboard.view_financial_cards = { allowed: false, scope: "own" };
        }
      }
    }
    return map;
  };

  // 2. Fetch user custom permission overrides from database
  const { data: overrides, error: overridesError } = await supabase
    .from("user_permissions")
    .select("module, action, scope")
    .eq("user_id", userId);

  if (overridesError || !overrides || overrides.length === 0) {
    return enforceFinanceGating(defaults);
  }

  // 3. Check for the special custom configuration core flag
  const hasCustom = overrides.some((ov) => ov.module === "_core" && ov.action === "custom");
  if (!hasCustom) {
    return enforceFinanceGating(defaults);
  }

  // 4. Since the user has custom configuration, initialize empty map and populate only overrides
  const customMap = getEmptyPermissionMap();
  overrides.forEach((ov) => {
    if (ov.module !== "_core" && customMap[ov.module]) {
      customMap[ov.module][ov.action] = {
        allowed: true,
        scope: ov.scope as PermissionScope,
      };
    }
  });

  return enforceFinanceGating(customMap);
});

// Check helper
export async function hasPermission(
  userId: string,
  module: string,
  action: string
): Promise<PermissionCheck> {
  const permissions = await getPermissions(userId);
  if (permissions[module] && permissions[module][action]) {
    return permissions[module][action];
  }
  return { allowed: false, scope: "own" };
}

// Server Component convenience checks
export async function canView(userId: string, module: string): Promise<boolean> {
  return (await hasPermission(userId, module, "view")).allowed;
}

export async function canCreate(userId: string, module: string): Promise<boolean> {
  return (await hasPermission(userId, module, "create")).allowed || (await hasPermission(userId, module, "add")).allowed;
}

export async function canEdit(userId: string, module: string): Promise<boolean> {
  return (await hasPermission(userId, module, "edit")).allowed;
}

export async function canDelete(userId: string, module: string): Promise<boolean> {
  return (await hasPermission(userId, module, "delete")).allowed;
}

export async function canExport(userId: string, module: string): Promise<boolean> {
  return (await hasPermission(userId, module, "export")).allowed;
}

// Scoped Data Queries filter helpers
export async function applyClientFilters(query: any, userId: string, scope: PermissionScope) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", userId)
    .single();

  if (profile?.role === "client") {
    return query.eq("id", profile.client_id || "00000000-0000-0000-0000-000000000000");
  }

  if (scope === "all") return query;
  
  // Find clients this user is assigned to
  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("client_id")
    .eq("user_id", userId);

  const assignedClientIds = assignments?.map((a) => a.client_id) || [];
  
  // Scoped select: client created by user OR assigned to user
  if (assignedClientIds.length > 0) {
    return query.or(`created_by.eq.${userId},id.in.(${assignedClientIds.join(",")})`);
  } else {
    return query.eq("created_by", userId);
  }
}

export async function applyProjectFilters(query: any, userId: string, scope: PermissionScope) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", userId)
    .single();

  if (profile?.role === "client") {
    return query.eq("client_id", profile.client_id || "00000000-0000-0000-0000-000000000000");
  }

  if (scope === "all") return query;

  // Find clients this user is assigned to
  const { data: assignments } = await supabase
    .from("client_assignments")
    .select("client_id")
    .eq("user_id", userId);

  const assignedClientIds = assignments?.map((a) => a.client_id) || [];

  // Scoped select: project created by user OR project's client is assigned to user
  if (assignedClientIds.length > 0) {
    return query.or(`created_by.eq.${userId},client_id.in.(${assignedClientIds.join(",")})`);
  } else {
    return query.eq("created_by", userId);
  }
}

export async function applyTaskFilters(query: any, userId: string, scope: PermissionScope) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", userId)
    .single();

  if (profile?.role === "client") {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("client_id", profile.client_id || "00000000-0000-0000-0000-000000000000");
    const projectIds = projects?.map((p) => p.id) || [];
    if (projectIds.length > 0) {
      return query.in("project_id", projectIds);
    } else {
      return query.eq("project_id", "00000000-0000-0000-0000-000000000000");
    }
  }

  if (scope === "all") return query;

  // Scoped select: task assigned to user OR task created by user
  return query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`);
}

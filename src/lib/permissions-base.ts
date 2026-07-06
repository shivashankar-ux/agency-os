export type PermissionScope = "own" | "team" | "all";

export type PermissionCheck = {
  allowed: boolean;
  scope: PermissionScope;
};

export type PermissionMap = Record<string, Record<string, PermissionCheck>>;

// Static Role Defaults
export const ROLE_DEFAULTS: Record<string, PermissionMap> = {
  owner: {
    // Unrestricted access to everything with scope = 'all'
    clients: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" }, export: { allowed: true, scope: "all" } },
    projects: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, archive: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    tasks: { view: { allowed: true, scope: "all" }, assign: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, complete: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    team: { view: { allowed: true, scope: "all" }, invite: { allowed: true, scope: "all" }, remove: { allowed: true, scope: "all" }, change_roles: { allowed: true, scope: "all" } },
    crm: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" }, convert: { allowed: true, scope: "all" } },
    dashboard: { view_revenue: { allowed: true, scope: "all" }, view_analytics: { allowed: true, scope: "all" }, view_kpis: { allowed: true, scope: "all" }, view_financial_cards: { allowed: true, scope: "all" }, view_team_performance: { allowed: true, scope: "all" } },
    reports: { view: { allowed: true, scope: "all" }, export: { allowed: true, scope: "all" } },
    finance: { view: { allowed: true, scope: "all" }, create_invoice: { allowed: true, scope: "all" }, edit_invoice: { allowed: true, scope: "all" }, expenses: { allowed: true, scope: "all" }, revenue: { allowed: true, scope: "all" }, profit: { allowed: true, scope: "all" } },
    files: { upload: { allowed: true, scope: "all" }, download: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    ai: { proposal_generator: { allowed: true, scope: "all" }, marketing_ai: { allowed: true, scope: "all" }, caption_generator: { allowed: true, scope: "all" }, reports_ai: { allowed: true, scope: "all" } },
    settings: { company_settings: { allowed: true, scope: "all" }, branding: { allowed: true, scope: "all" }, integrations: { allowed: true, scope: "all" }, delete_workspace: { allowed: true, scope: "all" } },
  },
  admin: {
    // Almost full access, cannot delete workspace or manage super admin fields
    clients: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" }, export: { allowed: true, scope: "all" } },
    projects: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, archive: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    tasks: { view: { allowed: true, scope: "all" }, assign: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, complete: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    team: { view: { allowed: true, scope: "all" }, invite: { allowed: true, scope: "all" }, remove: { allowed: true, scope: "all" }, change_roles: { allowed: true, scope: "all" } },
    crm: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" }, convert: { allowed: true, scope: "all" } },
    dashboard: { view_revenue: { allowed: true, scope: "all" }, view_analytics: { allowed: true, scope: "all" }, view_kpis: { allowed: true, scope: "all" }, view_financial_cards: { allowed: true, scope: "all" }, view_team_performance: { allowed: true, scope: "all" } },
    reports: { view: { allowed: true, scope: "all" }, export: { allowed: true, scope: "all" } },
    finance: { view: { allowed: true, scope: "all" }, create_invoice: { allowed: true, scope: "all" }, edit_invoice: { allowed: true, scope: "all" }, expenses: { allowed: true, scope: "all" }, revenue: { allowed: true, scope: "all" }, profit: { allowed: true, scope: "all" } },
    files: { upload: { allowed: true, scope: "all" }, download: { allowed: true, scope: "all" }, delete: { allowed: true, scope: "all" } },
    ai: { proposal_generator: { allowed: true, scope: "all" }, marketing_ai: { allowed: true, scope: "all" }, caption_generator: { allowed: true, scope: "all" }, reports_ai: { allowed: true, scope: "all" } },
    settings: { company_settings: { allowed: true, scope: "all" }, branding: { allowed: true, scope: "all" }, integrations: { allowed: true, scope: "all" }, delete_workspace: { allowed: false, scope: "all" } },
  },
  manager: {
    // Managers default to view & edit rights but can be configured individually via UI
    clients: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: false, scope: "all" }, export: { allowed: false, scope: "all" } },
    projects: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, archive: { allowed: true, scope: "all" }, delete: { allowed: false, scope: "all" } },
    tasks: { view: { allowed: true, scope: "all" }, assign: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, complete: { allowed: true, scope: "all" }, delete: { allowed: false, scope: "all" } },
    team: { view: { allowed: true, scope: "all" }, invite: { allowed: false, scope: "all" }, remove: { allowed: false, scope: "all" }, change_roles: { allowed: false, scope: "all" } },
    crm: { view: { allowed: true, scope: "all" }, create: { allowed: true, scope: "all" }, edit: { allowed: true, scope: "all" }, delete: { allowed: false, scope: "all" }, convert: { allowed: false, scope: "all" } },
    dashboard: { view_revenue: { allowed: false, scope: "all" }, view_analytics: { allowed: true, scope: "all" }, view_kpis: { allowed: true, scope: "all" }, view_financial_cards: { allowed: false, scope: "all" }, view_team_performance: { allowed: true, scope: "all" } },
    reports: { view: { allowed: true, scope: "all" }, export: { allowed: false, scope: "all" } },
    finance: { view: { allowed: false, scope: "all" }, create_invoice: { allowed: false, scope: "all" }, edit_invoice: { allowed: false, scope: "all" }, expenses: { allowed: false, scope: "all" }, revenue: { allowed: false, scope: "all" }, profit: { allowed: false, scope: "all" } },
    files: { upload: { allowed: true, scope: "all" }, download: { allowed: true, scope: "all" }, delete: { allowed: false, scope: "all" } },
    ai: { proposal_generator: { allowed: true, scope: "all" }, marketing_ai: { allowed: false, scope: "all" }, caption_generator: { allowed: true, scope: "all" }, reports_ai: { allowed: false, scope: "all" } },
    settings: { company_settings: { allowed: false, scope: "all" }, branding: { allowed: false, scope: "all" }, integrations: { allowed: false, scope: "all" }, delete_workspace: { allowed: false, scope: "all" } },
  },
  member: {
    // Employees (members) have highly restricted defaults and scope = 'own'
    clients: { view: { allowed: true, scope: "own" }, create: { allowed: false, scope: "own" }, edit: { allowed: false, scope: "own" }, delete: { allowed: false, scope: "own" }, export: { allowed: false, scope: "own" } },
    projects: { view: { allowed: true, scope: "own" }, create: { allowed: false, scope: "own" }, edit: { allowed: false, scope: "own" }, archive: { allowed: false, scope: "own" }, delete: { allowed: false, scope: "own" } },
    tasks: { view: { allowed: true, scope: "own" }, assign: { allowed: false, scope: "own" }, create: { allowed: false, scope: "own" }, complete: { allowed: true, scope: "own" }, delete: { allowed: false, scope: "own" } },
    team: { view: { allowed: false, scope: "own" }, invite: { allowed: false, scope: "own" }, remove: { allowed: false, scope: "own" }, change_roles: { allowed: false, scope: "own" } },
    crm: { view: { allowed: false, scope: "own" }, create: { allowed: false, scope: "own" }, edit: { allowed: false, scope: "own" }, delete: { allowed: false, scope: "own" }, convert: { allowed: false, scope: "own" } },
    dashboard: { view_revenue: { allowed: false, scope: "own" }, view_analytics: { allowed: false, scope: "own" }, view_kpis: { allowed: true, scope: "own" }, view_financial_cards: { allowed: false, scope: "own" }, view_team_performance: { allowed: false, scope: "own" } },
    reports: { view: { allowed: false, scope: "own" }, export: { allowed: false, scope: "own" } },
    finance: { view: { allowed: false, scope: "own" }, create_invoice: { allowed: false, scope: "own" }, edit_invoice: { allowed: false, scope: "own" }, expenses: { allowed: false, scope: "own" }, revenue: { allowed: false, scope: "own" }, profit: { allowed: false, scope: "own" } },
    files: { upload: { allowed: true, scope: "own" }, download: { allowed: true, scope: "own" }, delete: { allowed: false, scope: "own" } },
    ai: { proposal_generator: { allowed: false, scope: "own" }, marketing_ai: { allowed: false, scope: "own" }, caption_generator: { allowed: false, scope: "own" }, reports_ai: { allowed: false, scope: "own" } },
    settings: { company_settings: { allowed: false, scope: "own" }, branding: { allowed: false, scope: "own" }, integrations: { allowed: false, scope: "own" }, delete_workspace: { allowed: false, scope: "own" } },
  },
};

export function getEmptyPermissionMap(): PermissionMap {
  const map: PermissionMap = {};
  for (const module in ROLE_DEFAULTS.owner) {
    map[module] = {};
    for (const action in ROLE_DEFAULTS.owner[module]) {
      map[module][action] = { allowed: false, scope: "own" };
    }
  }
  return map;
}

import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      redirect("/login");
    }
    if (profile.role === "client") {
      redirect("/dashboard/client-portal");
    }

    const supabase = await createClient();

    // Fetch profile and organization name join
    const { data: profileWithOrg } = await supabase
      .from("profiles")
      .select("*, organizations(name)")
      .eq("id", profile.id)
      .single();

    const workspaceName = profileWithOrg?.organizations?.name || "The Story Builder";

    // Resolve user permissions and scopes
    const permissions = await getPermissions(profile.id);
    const canViewClients = permissions.clients?.view?.allowed || false;
    const canViewProjects = permissions.projects?.view?.allowed || false;
    const canViewTasks = permissions.tasks?.view?.allowed || false;
    const canViewTeam = permissions.team?.view?.allowed || false;
    const canViewFinance = permissions.finance?.view?.allowed || false;
    const canViewRevenue = canViewFinance && (permissions.dashboard?.view_revenue?.allowed || false);
    const canViewAnalytics = permissions.dashboard?.view_analytics?.allowed || false;
    const canViewTeamPerformance = canViewTeam && (permissions.dashboard?.view_team_performance?.allowed || false);
    const canViewReports = permissions.reports?.view?.allowed || false;

    // Load dynamic aggregations from Supabase
    const data = await getDashboardData();
    const { kpis } = data;

    // Formatting currency values
    const formattedRevenue = `₹${kpis.revenue.toLocaleString("en-IN")}`;
    const formattedPendingRevenue = `₹${kpis.pendingRevenue.toLocaleString("en-IN")}`;

    // Dynamic greeting calculation
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    // Dynamic Date
    const formattedDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Dynamic Role Badge Styles
    const roleBadges: Record<string, string> = {
      owner: "bg-amber-950/40 text-amber-400 border-amber-900/50",
      admin: "bg-red-950/40 text-red-400 border-red-900/50",
      manager: "bg-indigo-950/40 text-indigo-400 border-indigo-900/50",
      member: "bg-neutral-800 text-neutral-400 border-neutral-700",
    };

    const roleBadgeText: Record<string, string> = {
      owner: "Super Admin",
      admin: "Administrator",
      manager: "Manager",
      member: "Employee",
    };

    return (
      <div className="space-y-6">
        {/* SECTION 1: Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-850 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {greeting}, {profile.name}
            </h1>
            <p className="text-neutral-500 text-xs mt-1.5 flex items-center gap-1.5">
              <span>{formattedDate}</span>
              <span className="text-neutral-700">·</span>
              <span className="text-indigo-400 font-semibold">{workspaceName}</span>
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <span
              className={`text-xxs px-3 py-1 rounded-full border font-semibold tracking-wider uppercase ${
                roleBadges[profile.role] || roleBadges.member
              }`}
            >
              {roleBadgeText[profile.role] || "Employee"}
            </span>
          </div>
        </div>

        {/* Dynamic widget grid wrapper */}
        <DashboardClient
          profile={profile}
          workspaceName={workspaceName}
          data={data}
          permissions={{
            canViewClients,
            canViewProjects,
            canViewTasks,
            canViewTeam,
            canViewFinance,
            canViewRevenue,
            canViewAnalytics,
            canViewTeamPerformance,
            canViewReports,
          }}
          formattedRevenue={formattedRevenue}
          formattedPendingRevenue={formattedPendingRevenue}
        />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="bg-red-950/20 border border-red-900 text-red-400 p-6 rounded-xl text-center space-y-3">
        <h2 className="text-white text-base font-bold">Failed to load dashboard data</h2>
        <p className="text-xs leading-relaxed max-w-md mx-auto">
          {error.message || "An unexpected database connectivity error occurred. Please verify your connection."}
        </p>
      </div>
    );
  }
}


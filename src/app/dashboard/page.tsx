import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getPermissions } from "@/lib/permissions";
import KpiCard from "./components/KpiCard";
import QuickActions from "./components/QuickActions";
import ActivityTimeline from "./components/ActivityTimeline";
import TaskCharts from "./components/TaskCharts";
import ProjectsProgressList from "./components/ProjectsProgressList";
import TodaySchedule from "./components/TodaySchedule";
import TeamPerformance from "./components/TeamPerformance";
import { redirect } from "next/navigation";
import { 
  Users, Briefcase, CheckCircle, Clock, HeartHandshake, DollarSign, Receipt, BellRing 
} from "lucide-react";

export default async function DashboardPage() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      redirect("/login");
    }
    const isOwner = profile.role === "owner";

    // Fetch user permissions and scopes
    const permissions = await getPermissions(profile.id);
    const canViewClients = permissions.clients?.view?.allowed || false;
    const canViewProjects = permissions.projects?.view?.allowed || false;
    const canViewTasks = permissions.tasks?.view?.allowed || false;
    const canViewTeam = permissions.team?.view?.allowed || false;
    const canViewFinance = permissions.finance?.view?.allowed || false;
    const canViewRevenue = canViewFinance && (permissions.dashboard?.view_revenue?.allowed || false);
    const canViewAnalytics = permissions.dashboard?.view_analytics?.allowed || false;
    const canViewTeamPerformance = canViewTeam && (permissions.dashboard?.view_team_performance?.allowed || false);

    // Load dynamic aggregations from Supabase in parallel (scoped to permissions inside helper)
    const data = await getDashboardData();
    const { kpis, activities, taskStatus, taskPriority, projects, schedule, teamPerformance } = data;

    // Formatting currency values
    const formattedRevenue = `₹${kpis.revenue.toLocaleString("en-IN")}`;
    const formattedPendingRevenue = `₹${kpis.pendingRevenue.toLocaleString("en-IN")}`;

    return (
      <div className="space-y-6">
        {/* Header Title Section */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isOwner ? "Executive Dashboard" : `Welcome back, ${profile.name}`}
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            {isOwner
              ? "Comprehensive analytics and operational status for The Story Builder"
              : "Here is your operational snapshot for today"}
          </p>
        </div>

        {/* 1. TOP SECTION: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {canViewClients && (
            <KpiCard
              label="Total Clients"
              value={kpis.totalClients}
              icon={<HeartHandshake size={18} />}
            />
          )}
          {canViewProjects && (
            <KpiCard
              label="Active Projects"
              value={kpis.activeProjects}
              icon={<Briefcase size={18} />}
            />
          )}
          {canViewTasks && (
            <KpiCard
              label="Pending Tasks"
              value={kpis.pendingTasks}
              icon={<Clock size={18} />}
            />
          )}
          {canViewTasks && (
            <KpiCard
              label="Completed Tasks"
              value={kpis.completedTasks}
              icon={<CheckCircle size={18} />}
            />
          )}
          {canViewTeam && (
            <KpiCard
              label="Team Members"
              value={kpis.teamMembers}
              icon={<Users size={18} />}
            />
          )}
          {canViewRevenue && (
            <KpiCard
              label="Paid Revenue"
              value={formattedRevenue}
              icon={<DollarSign size={18} />}
              trend={{ value: "Live Invoices", isPositive: true }}
            />
          )}
          {canViewRevenue && (
            <KpiCard
              label="Pending Invoices"
              value={formattedPendingRevenue}
              icon={<Receipt size={18} />}
              trend={{ value: "Sent", isPositive: true }}
            />
          )}
          {canViewTasks && (
            <KpiCard
              label="Active Deadlines"
              value={kpis.upcomingDeadlinesCount}
              icon={<BellRing size={18} />}
            />
          )}
        </div>

        {/* 2. SECOND SECTION: Quick Actions */}
        <QuickActions />

        {/* 3. GRID SECTION: Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Columns (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Task Charts */}
            {canViewTasks && canViewAnalytics && (
              <TaskCharts taskStatus={taskStatus} taskPriority={taskPriority} />
            )}

            {/* Projects Progress List */}
            {canViewProjects && (
              <ProjectsProgressList projects={projects} />
            )}

            {/* Team Performance Leaderboard */}
            {canViewTeamPerformance && (
              <TeamPerformance teamPerformance={teamPerformance} />
            )}
          </div>

          {/* Sidebar Columns (1/3 width) */}
          <div className="space-y-6">
            {/* Activities Timeline */}
            <ActivityTimeline activities={activities} />

            {/* Today Schedule List */}
            {canViewTasks && (
              <TodaySchedule schedule={schedule} />
            )}
          </div>
        </div>
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


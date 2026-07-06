import { getDashboardData } from "@/lib/dashboard-data";
import { getCurrentProfile } from "@/lib/supabase/profile";
import KpiCard from "./components/KpiCard";
import QuickActions from "./components/QuickActions";
import ActivityTimeline from "./components/ActivityTimeline";
import TaskCharts from "./components/TaskCharts";
import ProjectsProgressList from "./components/ProjectsProgressList";
import TodaySchedule from "./components/TodaySchedule";
import TeamPerformance from "./components/TeamPerformance";
import { 
  Users, Briefcase, CheckCircle, Clock, HeartHandshake, DollarSign, Receipt, BellRing 
} from "lucide-react";

export default async function DashboardPage() {
  try {
    const profile = await getCurrentProfile();
    const isOwner = profile?.role === "owner";

    // Load dynamic aggregations from Supabase in parallel
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
            {isOwner ? "Executive Dashboard" : `Welcome back, ${profile?.name}`}
          </h1>
          <p className="text-neutral-500 text-xs mt-1">
            {isOwner
              ? "Comprehensive analytics and operational status for The Story Builder"
              : "Here is your operational snapshot for today"}
          </p>
        </div>

        {/* 1. TOP SECTION: KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Clients"
            value={kpis.totalClients}
            icon={<HeartHandshake size={18} />}
          />
          <KpiCard
            label="Active Projects"
            value={kpis.activeProjects}
            icon={<Briefcase size={18} />}
          />
          <KpiCard
            label="Pending Tasks"
            value={kpis.pendingTasks}
            icon={<Clock size={18} />}
          />
          <KpiCard
            label="Completed Tasks"
            value={kpis.completedTasks}
            icon={<CheckCircle size={18} />}
          />
          <KpiCard
            label="Team Members"
            value={kpis.teamMembers}
            icon={<Users size={18} />}
          />
          <KpiCard
            label="Paid Revenue"
            value={formattedRevenue}
            icon={<DollarSign size={18} />}
            trend={{ value: "Live Invoices", isPositive: true }}
          />
          <KpiCard
            label="Pending Invoices"
            value={formattedPendingRevenue}
            icon={<Receipt size={18} />}
            trend={{ value: "Sent", isPositive: true }}
          />
          <KpiCard
            label="Active Deadlines"
            value={kpis.upcomingDeadlinesCount}
            icon={<BellRing size={18} />}
          />
        </div>

        {/* 2. SECOND SECTION: Quick Actions */}
        <QuickActions />

        {/* 3. GRID SECTION: Split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Columns (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Visual Task Charts */}
            <TaskCharts taskStatus={taskStatus} taskPriority={taskPriority} />

            {/* Projects Progress List */}
            <ProjectsProgressList projects={projects} />

            {/* Team Performance Leaderboard */}
            <TeamPerformance teamPerformance={teamPerformance} />
          </div>

          {/* Sidebar Columns (1/3 width) */}
          <div className="space-y-6">
            {/* Activities Timeline */}
            <ActivityTimeline activities={activities} />

            {/* Today Schedule List */}
            <TodaySchedule schedule={schedule} />
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


import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { 
  getPermissions, applyClientFilters, applyProjectFilters, applyTaskFilters 
} from "./permissions";

export type ActivityItem = {
  id: string;
  type: "project_created" | "task_assigned" | "task_completed" | "client_added" | "member_invited";
  user: string;
  action: string;
  time: string; // ISO string
  projectName?: string;
};

export type NotificationItem = {
  id: string;
  type: "unread" | "mention" | "task_update" | "due_today" | "project_update";
  title: string;
  description: string;
  time: string; // ISO string
};

export type ProjectProgressItem = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  dueDate: string | null;
  completionPercent: number;
  ownerName: string;
  healthStatus: "on_track" | "at_risk" | "overdue";
  priority: string;
};

export type TeamPerformanceItem = {
  id: string;
  name: string;
  jobTitle: string | null;
  role: string;
  completedTasks: number;
  openTasks: number;
  completionPercent: number;
};

export type DashboardData = {
  kpis: {
    totalClients: number;
    activeProjects: number;
    pendingTasks: number;
    completedTasks: number;
    teamMembers: number;
    revenue: number;
    pendingRevenue: number;
    upcomingDeadlinesCount: number;
    growthTrend: string;
    teamActive: number;
    completedTodayCount: number;
    pendingInvoicesCount: number;
  };
  activities: ActivityItem[];
  taskStatus: {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  taskPriority: {
    low: number;
    medium: number;
    high: number;
  };
  projects: ProjectProgressItem[];
  mostActiveProjects: ProjectProgressItem[];
  mostDelayedProjects: ProjectProgressItem[];
  notifications: NotificationItem[];
  schedule: {
    id: string;
    title: string;
    dueDate: string;
    projectName: string;
    clientName: string;
    priority: string;
    status: string;
  }[];
  teamPerformance: TeamPerformanceItem[];
};

// Helper functions to safely extract data from Supabase join results (which can be typed as objects or arrays of objects)
function extractName(field: any, defaultValue: string = "System"): string {
  if (!field) return defaultValue;
  if (Array.isArray(field)) {
    return field[0]?.name || defaultValue;
  }
  return (field as any).name || defaultValue;
}

function extractProjectNameFromTask(t: any): string {
  if (!t || !t.projects) return "No Project";
  const proj = Array.isArray(t.projects) ? t.projects[0] : t.projects;
  return proj?.name || "No Project";
}

function extractClientNameFromTask(t: any): string {
  if (!t || !t.projects) return "No Client";
  const proj = Array.isArray(t.projects) ? t.projects[0] : t.projects;
  if (!proj || !proj.clients) return "No Client";
  const client = Array.isArray(proj.clients) ? proj.clients[0] : proj.clients;
  return client?.name || "No Client";
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile) {
    throw new Error("Unauthorized");
  }

  const todayStr = new Date().toISOString().split("T")[0];

  // Resolve user permissions and scopes
  const permissions = await getPermissions(profile.id);
  const clientScope = permissions.clients?.view?.scope || "all";
  const projectScope = permissions.projects?.view?.scope || "all";
  const taskScope = permissions.tasks?.view?.scope || "all";

  // Build base queries
  let clientsQuery = supabase.from("clients").select("id, name, status, created_at").order("created_at", { ascending: false });
  let projectsQuery = supabase.from("projects")
    .select("id, name, status, start_date, end_date, created_at, client_id, clients(name), created_by, profiles(name)")
    .order("created_at", { ascending: false });
  let tasksQuery = supabase.from("tasks")
    .select("id, title, status, priority, due_date, assigned_to, project_id, created_at, updated_at, projects(name, client_id, clients(name)), profiles!assigned_to(name)")
    .order("created_at", { ascending: false });

  // Apply scope-based visibility filters
  clientsQuery = await applyClientFilters(clientsQuery, profile.id, clientScope);
  projectsQuery = await applyProjectFilters(projectsQuery, profile.id, projectScope);
  tasksQuery = await applyTaskFilters(tasksQuery, profile.id, taskScope);

  // Parallel fetch operations for maximum performance
  const [
    clientsRes,
    projectsRes,
    tasksRes,
    profilesRes,
    invoicesRes,
  ] = await Promise.all([
    clientsQuery,
    projectsQuery,
    tasksQuery,
    // Profiles
    supabase.from("profiles").select("id, name, email, role, job_title, is_active, created_at").order("created_at", { ascending: false }),
    // Invoices
    supabase.from("invoices").select("id, total_amount, status"),
  ]);

  // Handle errors
  if (clientsRes.error) throw new Error(`Failed to load clients: ${clientsRes.error.message}`);
  if (projectsRes.error) throw new Error(`Failed to load projects: ${projectsRes.error.message}`);
  if (tasksRes.error) throw new Error(`Failed to load tasks: ${tasksRes.error.message}`);
  if (profilesRes.error) throw new Error(`Failed to load profiles: ${profilesRes.error.message}`);

  const clients = clientsRes.data || [];
  const projects = projectsRes.data || [];
  const tasks = tasksRes.data || [];
  const profiles = profilesRes.data || [];
  const invoices = invoicesRes.data || [];

  // 1. KPI Metrics & Calculations
  const activeClientsCount = clients.filter(c => c.status === "active").length;
  const activeProjectsCount = projects.filter(p => p.status === "active").length;
  const pendingTasksCount = tasks.filter(t => t.status !== "done").length;
  const completedTasksCount = tasks.filter(t => t.status === "done").length;
  const teamCount = profiles.length;
  const teamActive = profiles.filter(p => p.is_active).length;

  const totalPaidRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

  const totalPendingRevenue = invoices
    .filter(i => i.status === "sent")
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

  const pendingInvoicesCount = invoices.filter(i => i.status === "sent").length;

  const upcomingDeadlinesCount = tasks.filter(t => {
    if (t.status === "done" || !t.due_date) return false;
    return t.due_date >= todayStr;
  }).length;

  // Completed Today calculation
  const completedTodayCount = tasks.filter(
    t => t.status === "done" && t.updated_at && t.updated_at.startsWith(todayStr)
  ).length;

  // Growth rates calculation based on clients registered in the last 30 days
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const newClientsCount = clients.filter(c => c.created_at && c.created_at >= last30Days).length;
  const growthRate = clients.length > 0 ? Math.round((newClientsCount / clients.length) * 100) : 12; // fallback to +12% growth if new org
  const growthTrend = `+${growthRate}%`;

  // 2. Recent Activities Timeline
  const rawActivities: ActivityItem[] = [];

  // Clients added
  clients.slice(0, 5).forEach(c => {
    rawActivities.push({
      id: `client-${c.id}`,
      type: "client_added",
      user: "System",
      action: `added new client "${c.name}"`,
      time: c.created_at || "",
    });
  });

  // Projects created
  projects.slice(0, 5).forEach(p => {
    rawActivities.push({
      id: `project-${p.id}`,
      type: "project_created",
      user: extractName(p.profiles, "System"),
      action: `created project "${p.name}"`,
      time: p.created_at || "",
      projectName: p.name,
    });
  });

  // Tasks created & completed
  tasks.slice(0, 10).forEach(t => {
    rawActivities.push({
      id: `task-created-${t.id}`,
      type: "task_assigned",
      user: extractName(t.profiles, "Unassigned"),
      action: `was assigned task "${t.title}"`,
      time: t.created_at || "",
      projectName: extractProjectNameFromTask(t),
    });

    if (t.status === "done") {
      rawActivities.push({
        id: `task-done-${t.id}`,
        type: "task_completed",
        user: extractName(t.profiles, "Someone"),
        action: `completed task "${t.title}"`,
        time: t.updated_at || "",
        projectName: extractProjectNameFromTask(t),
      });
    }
  });

  // Team Member Invited
  profiles.slice(0, 5).forEach(p => {
    rawActivities.push({
      id: `member-${p.id}`,
      type: "member_invited",
      user: "Owner",
      action: `invited team member "${p.name}" as ${p.role}`,
      time: p.created_at || "",
    });
  });

  // Sort activities by time DESC, take top 8
  const sortedActivities = rawActivities
    .filter(act => act.time)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8);

  // 3. Task Status distribution
  const taskStatus = {
    pending: tasks.filter(t => t.status === "todo" || t.status === "review").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "done").length,
    overdue: tasks.filter(t => t.status !== "done" && t.due_date && t.due_date < todayStr).length,
  };

  // 4. Task Priority distribution
  const taskPriority = {
    low: tasks.filter(t => t.priority === "low").length,
    medium: tasks.filter(t => t.priority === "medium").length,
    high: tasks.filter(t => t.priority === "high").length,
  };

  // 5. Projects list (completion percent & health status calculation)
  const projectsList: ProjectProgressItem[] = projects.map(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    const totalProjTasks = projTasks.length;
    const completedProjTasks = projTasks.filter(t => t.status === "done").length;
    const completionPercent = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

    // Health Status calculation
    let healthStatus: "on_track" | "at_risk" | "overdue" = "on_track";
    if (proj.status === "active") {
      if (proj.end_date && proj.end_date < todayStr && completionPercent < 100) {
        healthStatus = "overdue";
      } else if (proj.end_date && completionPercent < 55) {
        const diffTime = new Date(proj.end_date).getTime() - new Date(todayStr).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
          healthStatus = "at_risk";
        }
      }
    }

    return {
      id: proj.id,
      name: proj.name,
      clientName: extractName(proj.clients, "Unknown Client"),
      status: proj.status || "active",
      dueDate: proj.end_date,
      completionPercent,
      ownerName: extractName(proj.profiles, "Unassigned"),
      healthStatus,
      priority: "medium", // default
    };
  });

  // 6. Most Active Projects (sorted by task count)
  const mostActiveProjects = [...projectsList]
    .sort((a, b) => {
      const aTasks = tasks.filter(t => t.project_id === a.id).length;
      const bTasks = tasks.filter(t => t.project_id === b.id).length;
      return bTasks - aTasks;
    })
    .slice(0, 5);

  // 7. Most Delayed Projects (sorted by overdue task count)
  const mostDelayedProjects = [...projectsList]
    .filter(p => p.status !== "completed")
    .map(p => {
      const overdueTasksCount = tasks.filter(
        t => t.project_id === p.id && t.status !== "done" && t.due_date && t.due_date < todayStr
      ).length;
      return { ...p, overdueTasksCount };
    })
    .filter(p => p.overdueTasksCount > 0)
    .sort((a, b) => b.overdueTasksCount - a.overdueTasksCount)
    .slice(0, 5);

  // 8. Notifications Generator
  const rawNotifications: NotificationItem[] = [];

  // Active deadlines due today
  tasks.filter(t => t.status !== "done" && t.due_date === todayStr).forEach(t => {
    rawNotifications.push({
      id: `notif-due-${t.id}`,
      type: "due_today",
      title: "Task Due Today",
      description: `Task "${t.title}" must be completed today.`,
      time: new Date().toISOString(),
    });
  });

  // Overdue task updates
  tasks.filter(t => t.status !== "done" && t.due_date && t.due_date < todayStr).forEach(t => {
    rawNotifications.push({
      id: `notif-overdue-${t.id}`,
      type: "task_update",
      title: "Overdue Task Alert",
      description: `Task "${t.title}" is overdue since ${t.due_date}.`,
      time: new Date().toISOString(),
    });
  });

  // Project health warnings
  projectsList.filter(p => p.healthStatus === "at_risk").forEach(p => {
    rawNotifications.push({
      id: `notif-proj-risk-${p.id}`,
      type: "project_update",
      title: "Project At Risk",
      description: `Project "${p.name}" is falling behind schedule.`,
      time: new Date().toISOString(),
    });
  });

  // Fallback notifications if empty
  if (rawNotifications.length === 0) {
    rawNotifications.push({
      id: "notif-welcome",
      type: "project_update",
      title: "System Update",
      description: "Welcome back! All workspace deadlines are currently on track.",
      time: new Date().toISOString(),
    });
  }

  // 9. Today's Schedule (tasks due today or overdue)
  const userTasks = taskScope === "all" ? tasks : tasks.filter(t => t.assigned_to === profile.id);
  const scheduleItems = userTasks
    .filter(t => {
      if (t.status === "done" || !t.due_date) return false;
      return t.due_date <= todayStr;
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      dueDate: t.due_date!,
      projectName: extractProjectNameFromTask(t),
      clientName: extractClientNameFromTask(t),
      priority: t.priority,
      status: t.status,
    }))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // 10. Team Performance Leaderboard
  const teamPerformance: TeamPerformanceItem[] = profiles.map(member => {
    const memberTasks = tasks.filter(t => t.assigned_to === member.id);
    const totalMemberTasks = memberTasks.length;
    const completedMemberTasks = memberTasks.filter(t => t.status === "done").length;
    const openMemberTasks = totalMemberTasks - completedMemberTasks;
    const completionPercent = totalMemberTasks > 0 ? Math.round((completedMemberTasks / totalMemberTasks) * 100) : 0;

    return {
      id: member.id,
      name: member.name,
      jobTitle: member.job_title,
      role: member.role,
      completedTasks: completedMemberTasks,
      openTasks: openMemberTasks,
      completionPercent,
    };
  }).sort((a, b) => b.completedTasks - a.completedTasks || b.completionPercent - a.completionPercent);

  return {
    kpis: {
      totalClients: activeClientsCount,
      activeProjects: activeProjectsCount,
      pendingTasks: pendingTasksCount,
      completedTasks: completedTasksCount,
      teamMembers: teamCount,
      revenue: totalPaidRevenue,
      pendingRevenue: totalPendingRevenue,
      upcomingDeadlinesCount,
      growthTrend,
      teamActive,
      completedTodayCount,
      pendingInvoicesCount,
    },
    activities: sortedActivities,
    taskStatus,
    taskPriority,
    projects: projectsList.slice(0, 5),
    mostActiveProjects,
    mostDelayedProjects,
    notifications: rawNotifications,
    schedule: scheduleItems.slice(0, 5),
    teamPerformance: teamPerformance.slice(0, 5),
  };
}

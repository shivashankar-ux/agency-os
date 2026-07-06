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

export type ProjectProgressItem = {
  id: string;
  name: string;
  clientName: string;
  status: string;
  dueDate: string | null;
  completionPercent: number;
  ownerName: string;
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
    supabase.from("profiles").select("id, name, email, role, job_title, created_at").order("created_at", { ascending: false }),
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

  // 1. KPI Metrics
  const activeClientsCount = clients.filter(c => c.status === "active").length;
  const activeProjectsCount = projects.filter(p => p.status === "active").length;
  const pendingTasksCount = tasks.filter(t => t.status !== "done").length;
  const completedTasksCount = tasks.filter(t => t.status === "done").length;
  const teamCount = profiles.length;

  const totalPaidRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

  const totalPendingRevenue = invoices
    .filter(i => i.status === "sent")
    .reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0);

  const upcomingDeadlinesCount = tasks.filter(t => {
    if (t.status === "done" || !t.due_date) return false;
    return t.due_date >= todayStr;
  }).length;

  // 2. Recent Activities Timeline
  const rawActivities: ActivityItem[] = [];

  // Clients added
  clients.slice(0, 5).forEach(c => {
    rawActivities.push({
      id: `client-${c.id}`,
      type: "client_added",
      user: "System", // Default fallback if no created_by
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
    // Task created
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

  // 5. Projects list (completion percent calculation)
  const projectsList: ProjectProgressItem[] = projects.map(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    const totalProjTasks = projTasks.length;
    const completedProjTasks = projTasks.filter(t => t.status === "done").length;
    const completionPercent = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

    return {
      id: proj.id,
      name: proj.name,
      clientName: extractName(proj.clients, "Unknown Client"),
      status: proj.status || "active",
      dueDate: proj.end_date,
      completionPercent,
      ownerName: extractName(proj.profiles, "Unassigned"),
    };
  });

  // 6. Today's Schedule (tasks due today or overdue, prioritizing current user if not owner)
  const isOwner = profile.role === "owner";
  const userTasks = isOwner ? tasks : tasks.filter(t => t.assigned_to === profile.id);
  const scheduleItems = userTasks
    .filter(t => {
      if (t.status === "done" || !t.due_date) return false;
      return t.due_date <= todayStr; // due today or overdue
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

  // 7. Team Performance metrics
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
    },
    activities: sortedActivities,
    taskStatus,
    taskPriority,
    projects: projectsList.slice(0, 5), // top 5 projects
    schedule: scheduleItems.slice(0, 5), // top 5 due today
    teamPerformance: teamPerformance.slice(0, 5), // top 5 performers
  };
}

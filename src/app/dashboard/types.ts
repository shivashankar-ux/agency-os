import type { NotificationItem } from "@/lib/dashboard-data";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "manager" | "member" | "client";
  avatar_url?: string | null;
  is_active: boolean;
  org_id: string;
  created_at?: string;
  updated_at?: string;
  job_title?: string | null;
}

export interface DashboardKPIs {
  totalClients: number;
  activeProjects: number;
  pendingTasks: number;
  completedTasks: number;
  completedTodayCount: number;
  teamMembers: number;
  teamActive: number;
  revenue: number;
  growthTrend: string;
  pendingRevenue: number;
  pendingInvoicesCount: number;
  upcomingDeadlinesCount: number;
}

export interface DashboardActivity {
  id: string;
  type: "project_created" | "task_assigned" | "task_completed" | "client_added" | "member_invited";
  user: string;
  action: string;
  time: string;
  projectName?: string;
}

export interface TaskStatusData {
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TaskPriorityData {
  low: number;
  medium: number;
  high: number;
}

export interface DashboardProject {
  id: string;
  name: string;
  clientName: string;
  status: string;
  dueDate: string | null;
  completionPercent: number;
  ownerName: string;
  healthStatus: "on_track" | "at_risk" | "overdue";
  priority: string;
}

export type DashboardNotification = NotificationItem;

export interface ScheduleItem {
  id: string;
  title: string;
  dueDate: string;
  projectName: string;
  clientName: string;
  priority: string;
  status: string;
}

export interface TeamPerformanceItem {
  id: string;
  name: string;
  jobTitle: string | null;
  role: string;
  completedTasks: number;
  openTasks: number;
  completionPercent: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  activities: DashboardActivity[];
  taskStatus: TaskStatusData;
  taskPriority: TaskPriorityData;
  projects: DashboardProject[];
  mostActiveProjects: DashboardProject[];
  mostDelayedProjects: DashboardProject[];
  notifications: DashboardNotification[];
  schedule: ScheduleItem[];
  teamPerformance: TeamPerformanceItem[];
}

export interface DashboardPermissions {
  canViewClients: boolean;
  canViewProjects: boolean;
  canViewTasks: boolean;
  canViewTeam: boolean;
  canViewFinance: boolean;
  canViewRevenue: boolean;
  canViewAnalytics: boolean;
  canViewTeamPerformance: boolean;
  canViewReports: boolean;
}

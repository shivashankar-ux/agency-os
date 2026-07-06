import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function DashboardPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const isOwner = profile?.role === "owner";

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: taskCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq(isOwner ? "id" : "assigned_to", isOwner ? undefined : profile?.id)
    .neq("status", "done");

  const { count: overdueCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .lt("due_date", new Date().toISOString().split("T")[0])
    .neq("status", "done");

  const stats = [
    { label: "Active Clients", value: clientCount ?? 0, show: true },
    {
      label: isOwner ? "Open Tasks (All)" : "My Open Tasks",
      value: taskCount ?? 0,
      show: true,
    },
    { label: "Overdue Tasks", value: overdueCount ?? 0, show: true },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">
          {isOwner ? "Agency Overview" : `Welcome, ${profile?.name}`}
        </h1>
        <p className="text-neutral-500 text-sm mt-1">
          {isOwner
            ? "Everything happening across The Story Builder"
            : "Here's what's on your plate"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
          >
            <p className="text-neutral-500 text-xs font-medium">{stat.label}</p>
            <p className="text-white text-3xl font-semibold mt-2">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <h2 className="text-white text-sm font-medium mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href="/dashboard/clients"
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add Client
            </a>
            <a
              href="/dashboard/tasks"
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Assign Task
            </a>
            <a
              href="/dashboard/team"
              className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-1.5 rounded-lg transition-colors"
            >
              Manage Team
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

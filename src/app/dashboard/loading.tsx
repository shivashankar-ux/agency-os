export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Title section */}
      <div className="mb-6">
        <div className="h-6 w-48 bg-neutral-800 rounded-lg" />
        <div className="h-4 w-64 bg-neutral-850 rounded-lg mt-2" />
      </div>

      {/* KPI Cards Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-28" />
        ))}
      </div>

      {/* Quick Actions Skeletons */}
      <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-28" />

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Charts Skeletons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-72" />
            <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-72" />
          </div>

          {/* Projects Skeleton */}
          <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-80" />
        </div>

        <div className="space-y-5">
          {/* Timeline Skeleton */}
          <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-80" />

          {/* Schedule Skeleton */}
          <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-80" />
        </div>
      </div>
    </div>
  );
}

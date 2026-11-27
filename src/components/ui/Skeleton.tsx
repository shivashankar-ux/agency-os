export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-neutral-800 rounded-lg ${className}`} />;
}

export function SkeletonStatTile() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-14" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="grid px-3 py-3 border-t border-neutral-800 gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonStatTile key={i} />
        ))}
      </div>
      <SkeletonCard />
    </div>
  );
}

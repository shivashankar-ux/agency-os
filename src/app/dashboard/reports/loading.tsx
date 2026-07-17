export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-6 w-32 bg-neutral-800 rounded-lg" />
          <div className="h-4 w-48 bg-neutral-850 rounded-lg mt-1.5" />
        </div>
        <div className="h-9 w-28 bg-neutral-800 rounded-lg" />
      </div>

      <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5 space-y-4">
        <div className="h-8 w-full bg-neutral-850 rounded-lg" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

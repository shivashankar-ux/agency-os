export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-32 bg-neutral-800 rounded-lg" />
        <div className="h-4 w-48 bg-neutral-850 rounded-lg mt-1.5" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-neutral-900 border border-neutral-850 rounded-xl p-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
          ))}
        </div>
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-850 rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-neutral-800 rounded-lg" />
            <div className="h-9 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 bg-neutral-800 rounded-lg" />
            <div className="h-9 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
          </div>
          <div className="h-9 w-24 bg-neutral-800 rounded-lg self-end" />
        </div>
      </div>
    </div>
  );
}

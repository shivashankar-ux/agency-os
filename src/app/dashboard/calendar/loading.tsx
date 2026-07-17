export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-6 w-32 bg-neutral-800 rounded-lg" />
          <div className="h-4 w-48 bg-neutral-850 rounded-lg mt-1.5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-neutral-800 rounded-lg" />
          <div className="h-9 w-20 bg-neutral-800 rounded-lg" />
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-5">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-6 w-full bg-neutral-800 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 h-[450px]">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="bg-neutral-950/40 border border-neutral-850/40 rounded-lg p-2 flex flex-col justify-between" />
          ))}
        </div>
      </div>
    </div>
  );
}

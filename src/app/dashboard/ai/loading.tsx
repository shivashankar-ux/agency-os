export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="mb-6">
        <div className="h-6 w-32 bg-neutral-800 rounded-lg" />
        <div className="h-4 w-48 bg-neutral-850 rounded-lg mt-1.5" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left side parameters form */}
        <div className="lg:col-span-4 bg-neutral-900 border border-neutral-850 rounded-xl p-5 space-y-4">
          <div className="h-5 w-24 bg-neutral-800 rounded-lg" />
          <div className="h-20 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
          <div className="h-10 w-full bg-neutral-800 rounded-lg" />
        </div>
        {/* Right side output viewer */}
        <div className="lg:col-span-8 bg-neutral-900 border border-neutral-850 rounded-xl p-5 h-[500px] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-5 w-32 bg-neutral-800 rounded-lg" />
            <div className="h-4 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
            <div className="h-4 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
            <div className="h-4 w-2/3 bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
          </div>
          <div className="h-10 w-full bg-neutral-950/40 border border-neutral-850/40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

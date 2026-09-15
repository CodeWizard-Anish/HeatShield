export function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Risk badge skeleton */}
      <div className="rounded-2xl p-6 bg-[#1e2a40] border border-[#2d3f5e] flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#2d3f5e]" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-40 bg-[#2d3f5e] rounded-lg" />
          <div className="h-4 w-full bg-[#2d3f5e] rounded" />
          <div className="h-2 w-full bg-[#2d3f5e] rounded-full" />
        </div>
      </div>

      {/* Apparent temp skeleton */}
      <div className="bg-[#1e2a40] rounded-xl px-5 py-4 border border-[#2d3f5e]">
        <div className="h-3 w-36 bg-[#2d3f5e] rounded mb-2" />
        <div className="h-10 w-28 bg-[#2d3f5e] rounded" />
      </div>

      {/* Weather cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1e2a40] rounded-xl p-4 border border-[#2d3f5e] space-y-2">
            <div className="h-3 w-16 bg-[#2d3f5e] rounded" />
            <div className="h-7 w-20 bg-[#2d3f5e] rounded" />
          </div>
        ))}
      </div>

      {/* AI panel skeleton */}
      <div className="bg-[#1e2a40] rounded-2xl p-5 border border-[#2d3f5e] space-y-3">
        <div className="h-4 w-24 bg-[#2d3f5e] rounded" />
        <div className="h-4 w-full bg-[#2d3f5e] rounded" />
        <div className="h-4 w-5/6 bg-[#2d3f5e] rounded" />
        <div className="h-4 w-4/5 bg-[#2d3f5e] rounded" />
      </div>
    </div>
  );
}

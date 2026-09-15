export function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Risk badge skeleton */}
      <div className="rounded-2xl p-6 bg-white border border-orange-100 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-orange-100" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-40 bg-orange-100 rounded-lg" />
          <div className="h-4 w-full bg-orange-50 rounded" />
          <div className="h-2.5 w-full bg-orange-100 rounded-full" />
        </div>
      </div>

      {/* Apparent temp skeleton */}
      <div className="bg-white rounded-xl px-5 py-4 border border-orange-100 shadow-sm">
        <div className="h-3 w-48 bg-orange-100 rounded mb-3" />
        <div className="h-12 w-32 bg-orange-100 rounded" />
        <div className="h-3 w-40 bg-orange-50 rounded mt-2" />
      </div>

      {/* Weather cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm space-y-2">
            <div className="h-3 w-20 bg-orange-100 rounded" />
            <div className="h-7 w-24 bg-orange-100 rounded" />
          </div>
        ))}
      </div>

      {/* AI panel skeleton */}
      <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-3">
        <div className="h-4 w-24 bg-orange-100 rounded" />
        <div className="h-4 w-full bg-orange-50 rounded" />
        <div className="h-4 w-5/6 bg-orange-50 rounded" />
        <div className="h-4 w-4/5 bg-orange-50 rounded" />
      </div>
    </div>
  );
}

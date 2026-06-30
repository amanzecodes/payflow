export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Top Header Skeleton */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="h-9 w-40 bg-zinc-200 rounded-lg animate-pulse" />
        <div className="mt-2.5 h-5 w-96 bg-zinc-100 rounded-lg animate-pulse" />
      </div>

      {/* Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-xl bg-white min-h-36 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-zinc-200 rounded animate-pulse" />
              <div className="h-9 w-9 bg-zinc-200 rounded-lg animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-32 bg-zinc-200 rounded animate-pulse mt-3" />
              <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-6 rounded-xl bg-white">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-14 bg-zinc-200 rounded-lg animate-pulse"
          />
        ))}
      </div>

      {/* Primary Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left: Current Cycle Status Skeleton */}
        <div className="p-6 rounded-xl bg-white">
          <div className="mb-4">
            <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-zinc-100 rounded animate-pulse mt-1.5" />
          </div>

          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between min-h-14">
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse mt-0.5" />
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-zinc-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full mt-4 pt-4 border-t border-zinc-100">
            <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Right: Live Activity Feed Skeleton */}
        <div className="p-6 rounded-xl bg-white">
          <div className="mb-4">
            <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-zinc-100 rounded animate-pulse mt-1.5" />
          </div>

          <div className="divide-y divide-zinc-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between min-h-14">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-4 w-28 bg-zinc-200 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-zinc-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="w-full mt-4 pt-4 border-t border-zinc-100">
            <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

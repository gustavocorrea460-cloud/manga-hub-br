export function MangaCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl bg-card border border-border overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-border" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-border rounded w-3/4" />
        <div className="h-3 bg-border rounded w-1/2" />
      </div>
    </div>
  )
}

export function ChapterListSkeleton() {
  return (
    <div className="divide-y divide-border rounded-xl bg-card border border-border animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="h-4 bg-border rounded w-24" />
          <div className="h-3 bg-border rounded w-16" />
        </div>
      ))}
    </div>
  )
}

export function MangaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MangaCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function MangaDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 aspect-[3/4] bg-card rounded-xl" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-card rounded w-3/4" />
          <div className="h-4 bg-card rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-3 bg-card rounded" />
            <div className="h-3 bg-card rounded" />
            <div className="h-3 bg-card rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

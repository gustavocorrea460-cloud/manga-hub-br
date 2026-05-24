import { MangaGridSkeleton } from "@/components/LoadingSkeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-card rounded animate-pulse" />
      <MangaGridSkeleton />
    </div>
  )
}

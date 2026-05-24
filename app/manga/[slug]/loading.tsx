import { MangaDetailSkeleton, ChapterListSkeleton } from "@/components/LoadingSkeleton"

export default function MangaLoading() {
  return (
    <div className="space-y-8">
      <MangaDetailSkeleton />
      <div>
        <div className="h-7 w-24 bg-card rounded animate-pulse mb-4" />
        <ChapterListSkeleton />
      </div>
    </div>
  )
}

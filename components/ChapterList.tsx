import Link from "next/link"
import type { Chapter } from "@/types/mangadex"
import { formatRelativeTime, formatChapter } from "@/lib/utils"

interface Props {
  chapters: Chapter[]
  mangaId: string
}

export default function ChapterList({ chapters, mangaId }: Props) {
  if (chapters.length === 0) {
    return (
      <p className="text-muted text-sm py-8 text-center">
        Nenhum capítulo disponível em português.
      </p>
    )
  }

  return (
    <div className="divide-y divide-border rounded-xl bg-card border border-border overflow-hidden">
      {chapters.map(chapter => (
        <Link
          key={chapter.id}
          href={`/leitor/${chapter.id}?mangaId=${mangaId}`}
          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium shrink-0">
              {formatChapter(chapter.attributes.chapter)}
            </span>
            {chapter.attributes.title && (
              <span className="text-sm text-muted truncate">
                — {chapter.attributes.title}
              </span>
            )}
          </div>
          <span className="text-xs text-muted shrink-0">
            {formatRelativeTime(chapter.attributes.publishAt)}
          </span>
        </Link>
      ))}
    </div>
  )
}

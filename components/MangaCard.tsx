import Link from "next/link"
import Image from "next/image"
import type { Manga } from "@/types/mangadex"
import { getTitle, getCoverUrl, getStatusLabel } from "@/types/mangadex"
import { formatRelativeTime, truncate } from "@/lib/utils"

interface Props {
  manga: Manga
}

export default function MangaCard({ manga }: Props) {
  const title = getTitle(manga)
  const coverUrl = getCoverUrl(manga, "256")
  const slug = manga.id

  return (
    <Link
      href={`/manga/${slug}`}
      className="group flex flex-col rounded-xl bg-card border border-border overflow-hidden hover:border-accent/50 transition-all duration-200 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="relative aspect-[3/4] bg-border overflow-hidden">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm p-4 text-center">
            Sem capa
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 leading-tight">
          {title}
        </h3>
        <span className="text-xs text-muted">
          {getStatusLabel(manga.attributes.status)}
        </span>
        <span className="text-xs text-muted mt-auto">
          {formatRelativeTime(manga.attributes.updatedAt)}
        </span>
      </div>
    </Link>
  )
}

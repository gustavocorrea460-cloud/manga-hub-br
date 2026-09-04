import Link from "next/link"
import Image from "next/image"
import SourceBadge from "@/components/SourceBadge"
import type { SourceId } from "@/components/SourceBadge"
import { formatRelativeTime } from "@/lib/utils"

/** Formato normalizado — qualquer fonte se converte para cá */
export interface CardManga {
  id: string
  title: string
  coverUrl: string | null
  source: SourceId
  type?: string | null
  status?: string | null
  updatedAt?: string | null
  rating?: number | null
}

interface Props {
  manga: CardManga
  index?: number
  /** Adiciona animação de entrada escalonada (padrão: ativada) */
  animate?: boolean
}

const statusLabels: Record<string, string> = {
  ongoing: "Em andamento",
  completed: "Completo",
  cancelled: "Cancelado",
  hiatus: "Em hiato",
  published: "Publicado",
  unpublished: "Não publicado",
}

export default function MangaCard({ manga, index = 0, animate = true }: Props) {
  const typeLabel = manga.type
    ? manga.type.charAt(0).toUpperCase() + manga.type.slice(1)
    : null

  return (
    <Link
      href={`/manga/${manga.id}?source=${manga.source}`}
      className={`group flex flex-col rounded-xl bg-card border border-border overflow-hidden
        hover:border-accent/60 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-200
        ${animate ? "fade-in" : ""}`}
      style={animate ? { animationDelay: `${Math.min(index, 12) * 50}ms` } : undefined}
    >
      <div className="relative aspect-[3/4] bg-border overflow-hidden">
        {manga.coverUrl ? (
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted text-sm p-4 text-center">
            Sem capa
          </div>
        )}
        <div className="absolute top-1.5 left-1.5">
          <SourceBadge source={manga.source} size="xs" />
        </div>
        {manga.rating != null && manga.rating > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-yellow-400">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-2.5 h-2.5" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {manga.rating.toFixed(1)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-3 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-accent transition-colors">
          {manga.title}
        </h3>
        <div className="flex items-center justify-between gap-1 mt-auto">
          {typeLabel ? (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {typeLabel}
            </span>
          ) : (
            <span />
          )}
          {manga.status && statusLabels[manga.status] && (
            <span className="text-[10px] text-muted/80">{statusLabels[manga.status]}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

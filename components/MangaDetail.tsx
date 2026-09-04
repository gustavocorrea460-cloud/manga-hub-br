import Image from "next/image"
import Link from "next/link"
import SourceBadge from "@/components/SourceBadge"
import FavoriteButton from "@/components/FavoriteButton"
import type { SourceId } from "@/components/SourceBadge"

/** Dados normalizados do mangá — qualquer fonte converte para cá */
export interface DetailManga {
  id: string
  title: string
  coverUrl: string | null
  status: string | null
  type: string | null
  year: string | null
  rating: number | null
  author: string | null
  genres: string[]
  themes: string[]
  description: string
  source: SourceId
}

export interface DetailChapter {
  id: string
  number: string
  title: string | null
  date: string | null
  /** Link externo (ex: QueroLer PDF) — se presente, não navega internamente */
  externalUrl?: string
}

interface Props {
  manga: DetailManga
  chapters: DetailChapter[]
  readingUrl?: string | null
}

const statusLabels: Record<string, string> = {
  ongoing: "Em andamento",
  completed: "Completo",
  cancelled: "Cancelado",
  hiatus: "Em hiato",
  published: "Publicado",
  unpublished: "Não publicado",
}

export default function MangaDetail({ manga, chapters, readingUrl }: Props) {
  const status = manga.status ? statusLabels[manga.status] || manga.status : null

  return (
    <>
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Capa */}
        <div className="relative w-full md:w-60 aspect-[3/4] shrink-0 rounded-lg overflow-hidden border border-border-strong shadow-card">
          {manga.coverUrl ? (
            <Image
              src={manga.coverUrl}
              alt={manga.title}
              fill
              sizes="(max-width: 768px) 100vw, 240px"
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Sem capa
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 min-w-0 flex-1">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <SourceBadge source={manga.source} />
              {manga.type && (
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {manga.type}
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {manga.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            {status && (
              <span className="px-3 py-1 rounded-full bg-accent-soft text-accent border border-accent-border text-xs font-medium">
                {status}
              </span>
            )}
            {manga.year && (
              <span className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted">
                {manga.year}
              </span>
            )}
            {manga.rating != null && manga.rating > 0 && (
              <span className="px-3 py-1 rounded-full bg-warning/10 text-warning border border-warning/25 text-xs font-medium">
                ★ {manga.rating.toFixed(1)}
              </span>
            )}
          </div>

          {manga.author && (
            <p className="text-sm text-muted">
              Autor: <span className="text-foreground font-medium">{manga.author}</span>
            </p>
          )}

          {manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted/70 mr-0.5">Gêneros:</span>
              {manga.genres.map(g => (
                <span key={g} className="px-2 py-0.5 rounded bg-card border border-border text-[11px] text-muted-foreground">
                  {g}
                </span>
              ))}
            </div>
          )}
          {manga.themes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs text-muted/70 mr-0.5">Temas:</span>
              {manga.themes.map(g => (
                <span key={g} className="px-2 py-0.5 rounded bg-card border border-border text-[11px] text-muted-foreground">
                  {g}
                </span>
              ))}
            </div>
          )}

          {manga.description && (
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line line-clamp-6">
              {manga.description}
            </p>
          )}

          {readingUrl && (
            <Link
              href={readingUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors tactile w-fit"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Começar a Ler
            </Link>
          )}

          <div className="flex items-center gap-2">
            <FavoriteButton manga={manga} />
          </div>
        </div>
      </div>

      {/* Capítulos */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Capítulos
          <span className="text-sm text-muted font-normal">({chapters.length})</span>
        </h2>
        <div className="space-y-1">
          {chapters.map(ch => {
            const content = (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm font-medium text-foreground shrink-0">
                    Cap. {ch.number}
                  </span>
                  {ch.title && (
                    <span className="text-sm text-muted truncate">{ch.title}</span>
                  )}
                  {ch.externalUrl && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">PDF</span>
                  )}
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted w-4 h-4" aria-hidden="true">
                  {ch.externalUrl ? (
                    <>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </>
                  ) : (
                    <path d="M9 18l6-6-6-6" />
                  )}
                </svg>
              </>
            )
            const cls = "flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors group"

            return ch.externalUrl ? (
              <a key={ch.id} href={ch.externalUrl} target="_blank" rel="noopener noreferrer" className={cls}>
                {content}
              </a>
            ) : (
              <Link key={ch.id} href={`/leitor/${ch.id}?source=${manga.source}&mangaId=${encodeURIComponent(manga.id)}`} className={cls}>
                {content}
              </Link>
            )
          })}
          {chapters.length === 0 && (
            <p className="text-sm text-muted">Nenhum capítulo encontrado.</p>
          )}
        </div>
      </section>
    </>
  )
}

import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import ChapterList from "@/components/ChapterList"
import ErrorMessage from "@/components/ErrorMessage"
import { ChapterListSkeleton, MangaDetailSkeleton } from "@/components/LoadingSkeleton"
import { getMangaCached, getChaptersCached } from "@/lib/cache"
import * as mangafire from "@/lib/api/mangafire"
import {
  getTitle,
  getDescription,
  getCoverUrl,
  getStatusLabel,
  getContentRatingLabel,
} from "@/types/mangadex"
import { formatDate } from "@/lib/utils"
import type { Chapter } from "@/types/mangadex"
import type { MangaFireChapter } from "@/types/mangafire"

type SourceId = "mangadex" | "mangafire"

async function MangaDetailMangaDex({ mangaId }: { mangaId: string }) {
  let manga
  try {
    manga = await getMangaCached(mangaId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar os detalhes deste mangá." />
  }

  const title = getTitle(manga)
  const description = getDescription(manga)
  const coverUrl = getCoverUrl(manga, "512")
  const author = manga.relationships.find(r => r.type === "author")
  const authorName = author?.attributes
    ? (author.attributes as { name?: string }).name
    : null

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative w-full md:w-64 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-card">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              Sem capa
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <h1 className="text-2xl font-bold">{title}</h1>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
              {getStatusLabel(manga.attributes.status)}
            </span>
            <span className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted">
              {getContentRatingLabel(manga.attributes.contentRating)}
            </span>
            {manga.attributes.year && (
              <span className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted">
                {manga.attributes.year}
              </span>
            )}
          </div>

          {authorName && (
            <p className="text-sm text-muted">
              Autor: <span className="text-foreground">{authorName}</span>
            </p>
          )}

          <p className="text-sm text-muted leading-relaxed">
            Atualizado em {formatDate(manga.attributes.updatedAt)}
          </p>

          {manga.attributes.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {manga.attributes.tags.map(tag => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded bg-card border border-border text-xs text-muted"
                >
                  {tag.attributes.name["pt-br"]
                    || tag.attributes.name.en
                    || tag.attributes.name.ja
                    || ""}
                </span>
              ))}
            </div>
          )}

          {description && (
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line line-clamp-6">
              {description}
            </p>
          )}
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Capítulos</h2>
          <span className="text-[10px] text-muted bg-card px-2 py-0.5 rounded border border-border">
            MangaDex
          </span>
        </div>
        <Suspense fallback={<ChapterListSkeleton />}>
          <ChaptersSectionMangaDex mangaId={mangaId} />
        </Suspense>
      </section>
    </>
  )
}

async function ChaptersSectionMangaDex({ mangaId }: { mangaId: string }) {
  let chapters
  try {
    chapters = await getChaptersCached(mangaId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar os capítulos." />
  }

  return <ChapterList chapters={chapters} mangaId={mangaId} />
}

async function MangaDetailMangaFire({ mangaId }: { mangaId: string }) {
  let manga
  try {
    manga = await mangafire.getManga(mangaId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar os detalhes deste mangá no MangaFire." />
  }

  const coverUrl = mangafire.getCoverUrl(manga)

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="relative w-full md:w-64 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-card">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={manga.title || ""}
              fill
              sizes="(max-width: 768px) 100vw, 256px"
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

        <div className="flex flex-col gap-3 min-w-0">
          <h1 className="text-2xl font-bold">{manga.title}</h1>

          {manga.altTitles && (
            <p className="text-sm text-muted">{manga.altTitles}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {manga.status && (
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
                {manga.status}
              </span>
            )}
            {manga.type && (
              <span className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted">
                {manga.type}
              </span>
            )}
            {manga.rating && (
              <span className="px-3 py-1 rounded-full bg-card border border-border text-xs text-muted">
                ★ {manga.rating}
              </span>
            )}
          </div>

          {manga.author && (
            <p className="text-sm text-muted">
              Autor: <span className="text-foreground">{manga.author}</span>
            </p>
          )}

          {manga.published && (
            <p className="text-sm text-muted">{manga.published}</p>
          )}

          {manga.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {manga.genres.map(g => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded bg-card border border-border text-xs text-muted"
                >
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
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Capítulos</h2>
          <span className="text-[10px] text-muted bg-card px-2 py-0.5 rounded border border-border">
            MangaFire
          </span>
        </div>
        <Suspense fallback={<ChapterListSkeleton />}>
          <ChaptersSectionMangaFire mangaId={mangaId} />
        </Suspense>
      </section>
    </>
  )
}

async function ChaptersSectionMangaFire({ mangaId }: { mangaId: string }) {
  let chapters: MangaFireChapter[]
  try {
    chapters = await mangafire.getChapters(mangaId, "en")
  } catch {
    return <ErrorMessage message="Não foi possível carregar os capítulos." />
  }

  if (chapters.length === 0) {
    return <p className="text-sm text-muted">Nenhum capítulo encontrado.</p>
  }

  return (
    <div className="space-y-1">
      {chapters.map(ch => (
        <Link
          key={ch.chapterId}
          href={`/leitor/${ch.chapterId}?mangaId=${mangaId}&source=mangafire`}
          className="flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-foreground shrink-0">
              Cap. {ch.number}
            </span>
            {ch.title && (
              <span className="text-sm text-muted truncate">{ch.title}</span>
            )}
          </div>
          {ch.releaseDate && (
            <span className="text-[11px] text-muted shrink-0 ml-2">
              {ch.releaseDate}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

export default async function MangaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ source?: string }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const source = (sp.source as SourceId) === "mangafire" ? "mangafire" : "mangadex"

  if (!slug) notFound()

  const DetailComponent = source === "mangafire" ? MangaDetailMangaFire : MangaDetailMangaDex

  return (
    <Suspense fallback={<MangaDetailSkeleton />}>
      <DetailComponent mangaId={slug} />
    </Suspense>
  )
}

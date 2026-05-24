import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import ChapterList from "@/components/ChapterList"
import ErrorMessage from "@/components/ErrorMessage"
import { ChapterListSkeleton, MangaDetailSkeleton } from "@/components/LoadingSkeleton"
import { getMangaCached, getChaptersCached } from "@/lib/cache"
import {
  getTitle,
  getDescription,
  getCoverUrl,
  getStatusLabel,
  getContentRatingLabel,
} from "@/types/mangadex"
import { formatDate } from "@/lib/utils"

async function MangaDetail({ mangaId }: { mangaId: string }) {
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
        <h2 className="text-xl font-bold mb-4">Capítulos</h2>
        <Suspense fallback={<ChapterListSkeleton />}>
          <ChaptersSection mangaId={mangaId} />
        </Suspense>
      </section>
    </>
  )
}

async function ChaptersSection({ mangaId }: { mangaId: string }) {
  let chapters
  try {
    chapters = await getChaptersCached(mangaId)
  } catch {
    return (
      <ErrorMessage message="Não foi possível carregar os capítulos." />
    )
  }

  return <ChapterList chapters={chapters} mangaId={mangaId} />
}

export default async function MangaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!slug) {
    notFound()
  }

  return (
    <Suspense fallback={<MangaDetailSkeleton />}>
      <MangaDetail mangaId={slug} />
    </Suspense>
  )
}

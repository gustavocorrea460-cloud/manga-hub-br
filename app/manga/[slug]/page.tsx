import { notFound } from "next/navigation"
import { Suspense } from "react"
import MangaDetail from "@/components/MangaDetail"
import ErrorMessage from "@/components/ErrorMessage"
import { MangaDetailSkeleton } from "@/components/LoadingSkeleton"
import {
  getMangaCached,
  getChaptersCached,
  getMangaFireCached,
  getMangaFireChaptersCached,
  getMangaStopCached,
  getMangaStopChaptersCached,
  getLeituraMangaCached,
  getLeituraMangaChaptersCached,
  getQueroLerMangaCached,
  getQueroLerChaptersCached,
  getNexusMangaCached,
  getNexusChaptersCached,
} from "@/lib/cache"
import type { DetailManga, DetailChapter } from "@/components/MangaDetail"
import type { SourceId } from "@/components/SourceBadge"
import { getTitle, getCoverUrl, getStatusLabel } from "@/types/mangadex"
import { formatDate } from "@/lib/utils"

const SOURCE_IDS: SourceId[] = ["mangadex", "mangafire", "mangastop", "leiturmanga", "queroler", "nexustoons"]

interface MangaData {
  manga: DetailManga
  chapters: DetailChapter[]
  readingUrl?: string | null
}

/** Fetcher por fonte: converte dados crus → DetailManga/DetailChapter */
async function fetchDetail(source: SourceId, id: string): Promise<MangaData> {
  switch (source) {
    case "mangafire": {
      const m = await getMangaFireCached(id)
      const chapters = await getMangaFireChaptersCached(id, "en")
      const genreTags = m.genres || []
      return {
        manga: {
          id,
          title: m.title || "Sem título",
          coverUrl: m.poster || null,
          status: m.status,
          type: m.type,
          year: m.published,
          rating: null,
          author: m.author,
          genres: genreTags,
          themes: [],
          description: m.description || "",
          source,
        },
        chapters: chapters.map(c => ({
          id: c.chapterId,
          number: c.number,
          title: c.title,
          date: c.releaseDate ? formatDate(c.releaseDate) : null,
        })),
      }
    }

    case "mangastop": {
      const m = await getMangaStopCached(id)
      const chapters = await getMangaStopChaptersCached(id)
      return {
        manga: {
          id,
          title: m.title || "Sem título",
          coverUrl: m.coverUrl,
          status: m.status,
          type: m.type,
          year: m.year,
          rating: null,
          author: m.author,
          genres: m.genres || [],
          themes: [],
          description: m.description || "",
          source,
        },
        chapters: chapters.map(c => ({
          id: c.chapterId,
          number: c.number,
          title: c.title,
          date: c.date ? formatDate(c.date) : null,
        })),
      }
    }

    case "leiturmanga": {
      const m = await getLeituraMangaCached(id)
      const chapters = await getLeituraMangaChaptersCached(id)
      return {
        manga: {
          id,
          title: m.title || "Sem título",
          coverUrl: m.coverUrl,
          status: m.status,
          type: null,
          year: m.year,
          rating: null,
          author: m.author,
          genres: m.genres || [],
          themes: [],
          description: m.description || "",
          source,
        },
        chapters: chapters.map(c => ({
          id: `${id}:${c.number}`,
          number: c.number,
          title: c.title,
          date: c.date ? formatDate(c.date) : null,
        })),
      }
    }

    case "queroler": {
      const m = await getQueroLerMangaCached(id)
      const chapters = await getQueroLerChaptersCached(id)
      return {
        manga: {
          id,
          title: m.title || "Sem título",
          coverUrl: m.coverUrl,
          status: m.status,
          type: null,
          year: m.year,
          rating: null,
          author: m.author,
          genres: m.genres || [],
          themes: [],
          description: m.description || "",
          source,
        },
        chapters: chapters.map(c => ({
          id: c.id,
          number: c.number,
          title: c.title,
          date: c.date ? formatDate(c.date) : null,
          externalUrl: `https://queroler.com${c.pdfUrl}`,
        })),
      }
    }

    case "nexustoons": {
      const m = await getNexusMangaCached(id)
      const chapters = await getNexusChaptersCached(id)
      const genres = (m.categories || []).filter(c => c.type === "genre").map(c => c.name)
      const themes = (m.categories || []).filter(c => c.type === "theme").map(c => c.name)
      return {
        manga: {
          id,
          title: m.title || "Sem título",
          coverUrl: m.coverImage,
          status: m.status,
          type: m.type,
          year: m.releaseYear?.toString() || null,
          rating: m.rating || null,
          author: m.author || null,
          genres,
          themes,
          description: m.description || "",
          source,
        },
        chapters: chapters.map(c => ({
          id: String(c.id),
          number: c.number,
          title: c.title,
          date: c.createdAt ? formatDate(c.createdAt) : null,
        })),
      }
    }

    case "mangadex":
    default: {
      const m = await getMangaCached(id)
      const chapters = await getChaptersCached(id)
      const coverRel = m.relationships.find(r => r.type === "cover_art")
      const fileName = coverRel?.attributes
        ? (coverRel.attributes as { fileName?: string }).fileName
        : undefined
      const authorRel = m.relationships.find(r => r.type === "author")
      const authorName = authorRel?.attributes
        ? (authorRel.attributes as { name?: string }).name
        : null
      return {
        manga: {
          id,
          title: getTitle(m),
          coverUrl: getCoverUrl(m, "512"),
          status: m.attributes.status,
          type: null,
          year: m.attributes.year?.toString() || null,
          rating: null,
          author: authorName || null,
          genres: m.attributes.tags.map(t => t.attributes.name.en || ""),
          themes: [],
          description:
            m.attributes.description["pt-br"] ||
            m.attributes.description.en ||
            "",
          source,
        },
        chapters: chapters.map(c => ({
          id: c.id,
          number: c.attributes.chapter || "0",
          title: c.attributes.title,
          date: c.attributes.publishAt ? formatDate(c.attributes.publishAt) : null,
        })),
      }
    }
  }
}

async function MangaDetailPage({ mangaId, source }: { mangaId: string; source: SourceId }) {
  let data: MangaData
  try {
    data = await fetchDetail(source, mangaId)
  } catch {
    return <ErrorMessage message={`Não foi possível carregar os detalhes deste mangá na fonte ${source}.`} />
  }

  const firstChapter = data.chapters[0]
  const readingUrl = firstChapter && !firstChapter.externalUrl
    ? `/leitor/${firstChapter.id}?source=${source}&mangaId=${encodeURIComponent(mangaId)}`
    : null

  return <MangaDetail manga={data.manga} chapters={data.chapters} readingUrl={readingUrl} />
}

export default async function MangaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ source?: string }>
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  if (!slug) notFound()

  const rawSource = (sp.source as SourceId) || "mangadex"
  const source: SourceId = SOURCE_IDS.includes(rawSource) ? rawSource : "mangadex"

  return (
    <Suspense fallback={<MangaDetailSkeleton />}>
      <MangaDetailPage mangaId={slug} source={source} />
    </Suspense>
  )
}

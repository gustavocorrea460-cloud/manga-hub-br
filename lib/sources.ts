import { getLatestMangas, getManga, getChapters, searchMangaWithFilters } from "@/lib/api/mangadex"
import { getChapterPagesCached } from "@/lib/cache"
import * as mangafire from "@/lib/api/mangafire"
import * as mangastop from "@/lib/api/mangastop"
import type { Manga } from "@/types/mangadex"
import type { MangaFireSearchResult, MangaFireManga, MangaFireChapter } from "@/types/mangafire"
import type { MangaStopSearchResult, MangaStopManga, MangaStopChapter } from "@/types/mangastop"

export type SourceId = "mangadex" | "mangafire" | "mangastop"

export interface UnifiedSearchResult {
  id: string
  title: string
  coverUrl: string | null
  type: string | null
  source: SourceId
}

export interface UnifiedManga {
  id: string
  title: string
  description: string
  coverUrl: string | null
  status: string
  author: string | null
  year: string | null
  genres: string[]
  source: SourceId
}

async function searchMangaFire(
  query: string,
  page: number,
): Promise<{ data: UnifiedSearchResult[]; total: number }> {
  const result = await mangafire.searchManga(query, page)
  const data = result.results.map((r: MangaFireSearchResult) => ({
    id: r.id || "",
    title: r.title || "Sem título",
    coverUrl: r.poster,
    type: r.type,
    source: "mangafire" as SourceId,
  }))
  return { data, total: result.totalPages * 20 }
}

async function searchMangaStop(
  query: string,
  _page: number,
): Promise<{ data: UnifiedSearchResult[]; total: number }> {
  const results = await mangastop.searchManga(query)
  const data = results.map((r: MangaStopSearchResult) => ({
    id: r.id,
    title: r.title,
    coverUrl: r.coverUrl,
    type: "mangastop",
    source: "mangastop" as SourceId,
  }))
  return { data, total: data.length }
}

async function searchMangaDex(
  query: string,
  page: number,
): Promise<{ data: UnifiedSearchResult[]; total: number }> {
  const result = await searchMangaWithFilters({ q: query, page, limit: 30 })
  const data = result.data.map((m: Manga) => {
    const title =
      m.attributes.title["pt-br"] ||
      m.attributes.title.en ||
      Object.values(m.attributes.title)[0] ||
      "Sem título"
    const coverRel = m.relationships.find(r => r.type === "cover_art")
    const fileName = coverRel?.attributes
      ? (coverRel.attributes as { fileName?: string }).fileName
      : undefined
    const coverUrl = fileName
      ? `https://uploads.mangadex.org/covers/${m.id}/${fileName}.256.jpg`
      : null
    return {
      id: m.id,
      title,
      coverUrl,
      type: null,
      source: "mangadex" as SourceId,
    }
  })
  return { data, total: result.total }
}

export async function searchSource(
  query: string,
  page: number = 1,
  source: SourceId = "mangadex",
): Promise<{ data: UnifiedSearchResult[]; total: number }> {
  if (source === "mangafire") return searchMangaFire(query, page)
  if (source === "mangastop") return searchMangaStop(query, page)
  return searchMangaDex(query, page)
}

async function getMangaMangaFire(id: string): Promise<UnifiedManga> {
  const m = await mangafire.getManga(id)
  return {
    id,
    title: m.title || "Sem título",
    description: m.description || "",
    coverUrl: mangafire.getCoverUrl(m),
    status: m.status || "",
    author: m.author,
    year: m.published,
    genres: m.genres,
    source: "mangafire",
  }
}

async function getMangaMangaStop(id: string): Promise<UnifiedManga> {
  const m = await mangastop.getManga(id)
  return {
    id,
    title: m.title || "Sem título",
    description: m.description || "",
    coverUrl: m.coverUrl,
    status: m.status || "",
    author: m.author,
    year: m.year,
    genres: m.genres,
    source: "mangastop",
  }
}

async function getMangaMangaDex(id: string): Promise<UnifiedManga> {
  const m = await getManga(id)
  const title =
    m.attributes.title["pt-br"] ||
    m.attributes.title.en ||
    Object.values(m.attributes.title)[0] ||
    "Sem título"
  const coverRel = m.relationships.find(r => r.type === "cover_art")
  const fileName = coverRel?.attributes
    ? (coverRel.attributes as { fileName?: string }).fileName
    : undefined
  const coverUrl = fileName
    ? `https://uploads.mangadex.org/covers/${m.id}/${fileName}.512.jpg`
    : null
  const author = m.relationships.find(r => r.type === "author")
  const authorName = author?.attributes
    ? (author.attributes as { name?: string }).name
    : null
  return {
    id,
    title,
    description:
      m.attributes.description["pt-br"] ||
      m.attributes.description.en ||
      "",
    coverUrl,
    status: m.attributes.status,
    author: authorName || null,
    year: m.attributes.year?.toString() || null,
    genres: m.attributes.tags.map(t => t.attributes.name.en || ""),
    source: "mangadex",
  }
}

export async function getMangaSource(
  id: string,
  source: SourceId = "mangadex",
): Promise<UnifiedManga> {
  if (source === "mangafire") return getMangaMangaFire(id)
  if (source === "mangastop") return getMangaMangaStop(id)
  return getMangaMangaDex(id)
}

export async function getChaptersSource(
  mangaId: string,
  source: SourceId = "mangadex",
): Promise<{ number: string; id: string; title: string | null; date: string | null }[]> {
  if (source === "mangafire") {
    const chapters = await mangafire.getChapters(mangaId, "en")
    return chapters.map((c: MangaFireChapter) => ({
      number: c.number,
      id: c.chapterId,
      title: c.title,
      date: c.releaseDate,
    }))
  }
  if (source === "mangastop") {
    const chapters = await mangastop.getChapters(mangaId)
    return chapters.map((c: MangaStopChapter) => ({
      number: c.number,
      id: c.chapterId,
      title: c.title,
      date: c.date,
    }))
  }
  const chapters = await getChapters(mangaId)
  return chapters.map(c => ({
    number: c.attributes.chapter || "0",
    id: c.id,
    title: c.attributes.title,
    date: c.attributes.publishAt,
  }))
}

export async function getChapterPagesSource(
  chapterId: string,
  source: SourceId = "mangadex",
): Promise<{ pages: string[]; baseUrl: string | null }> {
  if (source === "mangafire") {
    const images = await mangafire.getChapterImages(chapterId)
    return { pages: images, baseUrl: null }
  }
  if (source === "mangastop") {
    const images = await mangastop.getChapterImages(chapterId)
    return { pages: images, baseUrl: null }
  }
  const data = await getChapterPagesCached(chapterId)
  return { pages: data.dataSaver, baseUrl: data.baseUrl }
}

export function getSourceLabel(source: SourceId): string {
  const labels: Record<SourceId, string> = {
    mangadex: "MangaDex",
    mangafire: "MangaFire",
    mangastop: "MangaStop",
  }
  return labels[source] || source
}

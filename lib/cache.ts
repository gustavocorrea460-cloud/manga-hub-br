import {
  getCache,
  setCache,
  getChapterCache,
  setChapterCache,
  getMangaListCache,
  setMangaListCache,
} from "@/lib/db"
import {
  getLatestMangas,
  getManga,
  getChapters,
  getChapterPages,
  getTags as fetchTags,
} from "@/lib/api/mangadex"
import * as mangafire from "@/lib/api/mangafire"
import * as mangastop from "@/lib/api/mangastop"
import * as leiturmanga from "@/lib/api/leiturmanga"
import type { Manga, Chapter, Tag } from "@/types/mangadex"
import type { MangaFireSearchResponse, MangaFireManga, MangaFireChapter } from "@/types/mangafire"
import type { MangaStopSearchResult, MangaStopManga, MangaStopChapter } from "@/types/mangastop"
import type { LeituraMangaSearchResult, LeituraMangaManga, LeituraMangaChapter } from "@/types/leiturmanga"

const CACHE_TTL_MINUTES = 30

function isExpired(updatedAt: string): boolean {
  const then = new Date(updatedAt).getTime()
  const now = Date.now()
  return now - then > CACHE_TTL_MINUTES * 60 * 1000
}

async function withMangaCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number = CACHE_TTL_MINUTES,
): Promise<T> {
  const cached = await getCache(key)
  if (cached && !isExpiredCustom(cached.updated_at as string, ttlMinutes)) {
    return cached.data as T
  }
  try {
    const data = await fetchFn()
    await setCache(key, data)
    return data
  } catch {
    if (cached) {
      console.warn(`API falhou, servindo cache expirado para: ${key}`)
      return cached.data as T
    }
    throw new Error(`Falha ao buscar dados para ${key}`)
  }
}

async function withChapterCache<T>(
  key: string,
  mangaId: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number = CACHE_TTL_MINUTES,
): Promise<T> {
  const cached = await getChapterCache(key)
  if (cached && !isExpiredCustom(cached.updated_at as string, ttlMinutes)) {
    return cached.data as T
  }
  try {
    const data = await fetchFn()
    await setChapterCache(key, mangaId, data)
    return data
  } catch {
    if (cached) {
      console.warn(`API falhou, servindo cache expirado para: ${key}`)
      return cached.data as T
    }
    throw new Error(`Falha ao buscar dados para ${key}`)
  }
}

export async function getLatestMangasCached(
  page: number = 1,
): Promise<{ data: Manga[]; total: number }> {
  const cacheKey = `latest:page:${page}`

  const cached = await getMangaListCache(cacheKey)
  if (cached && !isExpired(cached.updated_at as string)) {
    const d = cached.data
    if (Array.isArray(d)) {
      return { data: d as Manga[], total: d.length }
    }
    return d as { data: Manga[]; total: number }
  }

  try {
    const result = await getLatestMangas(page)
    await setMangaListCache(cacheKey, result)
    return result
  } catch {
    if (cached) {
      console.warn("API falhou, servindo cache expirado para:", cacheKey)
      const d = cached.data
      if (Array.isArray(d)) {
        return { data: d as Manga[], total: d.length }
      }
      return d as { data: Manga[]; total: number }
    }
    throw new Error("MangaDex API indisponível e nenhum cache encontrado")
  }
}

export async function getMangaCached(id: string): Promise<Manga> {
  const cacheKey = `manga:${id}`

  const cached = await getCache(cacheKey)
  if (cached && !isExpired(cached.updated_at as string)) {
    return cached.data as Manga
  }

  try {
    const data = await getManga(id)
    await setCache(cacheKey, data)
    return data
  } catch {
    if (cached) {
      console.warn("API falhou, servindo cache expirado para:", cacheKey)
      return cached.data as Manga
    }
    throw new Error("MangaDex API indisponível e nenhum cache encontrado")
  }
}

export async function getChaptersCached(
  mangaId: string,
): Promise<Chapter[]> {
  const cacheKey = `chapters:${mangaId}`

  const cached = await getChapterCache(cacheKey)
  if (cached && !isExpired(cached.updated_at as string)) {
    return cached.data as Chapter[]
  }

  try {
    const data = await getChapters(mangaId)
    await setChapterCache(cacheKey, mangaId, data)
    return data
  } catch {
    if (cached) {
      console.warn("API falhou, servindo cache expirado para:", cacheKey)
      return cached.data as Chapter[]
    }
    throw new Error("MangaDex API indisponível e nenhum cache encontrado")
  }
}

const TAGS_CACHE_KEY = "mangadex:tags"
const TAGS_TTL_MINUTES = 360

export async function getTagsCached(): Promise<Tag[]> {
  const cached = await getCache(TAGS_CACHE_KEY)
  if (cached && !isExpiredCustom(cached.updated_at as string, TAGS_TTL_MINUTES)) {
    return cached.data as Tag[]
  }

  try {
    const tags = await fetchTags()
    await setCache(TAGS_CACHE_KEY, tags)
    return tags
  } catch {
    if (cached) {
      console.warn("API de tags falhou, servindo cache expirado")
      return cached.data as Tag[]
    }
    return []
  }
}

// ─── MangaFire Cached ──────────────────────────────────────────

export async function searchMangaFireCached(
  query: string,
  page: number = 1,
): Promise<MangaFireSearchResponse> {
  return withMangaCache(
    `mf:search:${query.toLowerCase().trim()}:${page}`,
    () => mangafire.searchManga(query, page),
  )
}

export async function getMangaFireCached(id: string): Promise<MangaFireManga> {
  return withMangaCache(
    `mf:manga:${id}`,
    () => mangafire.getManga(id),
  )
}

export async function getMangaFireChaptersCached(
  mangaId: string,
  lang: string = "pt-br",
): Promise<MangaFireChapter[]> {
  return withChapterCache(
    `mf:chapters:${mangaId}:${lang}`,
    `mf:${mangaId}`,
    () => mangafire.getChapters(mangaId, lang),
  )
}

export async function getMangaFirePagesCached(
  chapterId: string,
): Promise<string[]> {
  return withChapterCache(
    `mf:pages:${chapterId}`,
    `mf:${chapterId}`,
    () => mangafire.getChapterImages(chapterId),
  )
}

// ─── MangaStop Cached ──────────────────────────────────────────

export async function searchMangaStopCached(
  query: string,
): Promise<MangaStopSearchResult[]> {
  return withMangaCache(
    `ms:search:${query.toLowerCase().trim()}`,
    () => mangastop.searchManga(query),
  )
}

export async function getMangaStopCached(
  slug: string,
): Promise<MangaStopManga> {
  return withMangaCache(
    `ms:manga:${slug}`,
    () => mangastop.getManga(slug),
  )
}

export async function getMangaStopChaptersCached(
  slug: string,
): Promise<MangaStopChapter[]> {
  return withChapterCache(
    `ms:chapters:${slug}`,
    `ms:${slug}`,
    () => mangastop.getChapters(slug),
  )
}

export async function getMangaStopPagesCached(
  chapterUrlPath: string,
): Promise<string[]> {
  return withChapterCache(
    `ms:pages:${encodeURIComponent(chapterUrlPath)}`,
    `ms:${chapterUrlPath}`,
    () => mangastop.getChapterImages(chapterUrlPath),
  )
}

// ─── LeituraManga Cached ─────────────────────────────────────

export async function searchLeituraMangaCached(
  query: string,
): Promise<LeituraMangaSearchResult[]> {
  return withMangaCache(
    `llm:search:${query.toLowerCase().trim()}`,
    () => leiturmanga.searchManga(query),
  )
}

export async function getLeituraMangaCached(
  slug: string,
): Promise<LeituraMangaManga> {
  return withMangaCache(
    `llm:manga:${slug}`,
    () => leiturmanga.getManga(slug),
  )
}

export async function getLeituraMangaChaptersCached(
  slug: string,
): Promise<LeituraMangaChapter[]> {
  return withChapterCache(
    `llm:chapters:${slug}`,
    `llm:${slug}`,
    () => leiturmanga.getChapters(slug),
  )
}

export async function getLeituraMangaPagesCached(
  chapterId: string,
): Promise<string[]> {
  const [slug, num] = chapterId.split(":")
  if (!slug || !num) {
    throw new Error(`Invalid LeituraManga chapterId: ${chapterId}`)
  }
  return withChapterCache(
    `llm:pages:${slug}:${num}`,
    `llm:${slug}`,
    () => leiturmanga.getChapterImages(slug, num),
  )
}

// ─── Helpers ───────────────────────────────────────────────────

function isExpiredCustom(updatedAt: string, ttlMinutes: number): boolean {
  const then = new Date(updatedAt).getTime()
  const now = Date.now()
  return now - then > ttlMinutes * 60 * 1000
}

function normalizeChapterPages(
  data: unknown,
): { pages: string[]; dataSaver: string[]; baseUrl: string; hash: string } {
  const d = data as Record<string, unknown>
  return {
    pages: (d.pages || d.data) as string[],
    dataSaver: d.dataSaver as string[],
    baseUrl: d.baseUrl as string,
    hash: (d.hash as string) || "",
  }
}

export async function getChapterPagesCached(
  chapterId: string,
): Promise<{ pages: string[]; dataSaver: string[]; baseUrl: string; hash: string }> {
  const cacheKey = `pages:${chapterId}`

  const cached = await getChapterCache(cacheKey)
  if (cached && !isExpired(cached.updated_at as string)) {
    return normalizeChapterPages(cached.data)
  }

  try {
    const data = await getChapterPages(chapterId)
    const result = {
      pages: data.data,
      dataSaver: data.dataSaver,
      baseUrl: data.baseUrl,
      hash: data.hash,
    }
    await setChapterCache(cacheKey, chapterId, result)
    return result
  } catch {
    if (cached) {
      console.warn("API falhou, servindo cache expirado para:", cacheKey)
      return normalizeChapterPages(cached.data)
    }
    throw new Error("MangaDex API indisponível e nenhum cache encontrado")
  }
}

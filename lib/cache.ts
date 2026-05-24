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
} from "@/lib/api/mangadex"
import type { Manga, Chapter } from "@/types/mangadex"

const CACHE_TTL_MINUTES = 30

function isExpired(updatedAt: string): boolean {
  const then = new Date(updatedAt).getTime()
  const now = Date.now()
  return now - then > CACHE_TTL_MINUTES * 60 * 1000
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

export async function getChapterPagesCached(
  chapterId: string,
): Promise<{ pages: string[]; dataSaver: string[]; baseUrl: string; hash: string }> {
  const cacheKey = `pages:${chapterId}`

  const cached = await getChapterCache(cacheKey)
  if (cached && !isExpired(cached.updated_at as string)) {
    return cached.data as { pages: string[]; dataSaver: string[]; baseUrl: string; hash: string }
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
      return cached.data as { pages: string[]; dataSaver: string[]; baseUrl: string; hash: string }
    }
    throw new Error("MangaDex API indisponível e nenhum cache encontrado")
  }
}

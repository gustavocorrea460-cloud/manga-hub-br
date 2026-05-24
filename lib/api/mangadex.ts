import type {
  Manga,
  MangaResponse,
  SingleMangaResponse,
  Chapter,
  ChapterResponse,
  AtHomeResponse,
  CoverResponse,
} from "@/types/mangadex"

const BASE = "https://api.mangadex.org"

function createMangaParams(): URLSearchParams {
  const p = new URLSearchParams()
  p.set("includes[]", "cover_art")
  p.append("contentRating[]", "safe")
  p.append("contentRating[]", "suggestive")
  p.set("order[updatedAt]", "desc")
  p.set("availableTranslatedLanguage[]", "pt-br")
  return p
}

async function fetchMangaDex<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": "MangaHubBR/1.0",
      ...init?.headers,
    },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`MangaDex API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export async function getLatestMangas(
  page: number = 1,
  limit: number = 20,
): Promise<{ data: Manga[]; total: number }> {
  const params = createMangaParams()
  params.set("limit", String(limit))
  params.set("offset", String((page - 1) * limit))

  const data = await fetchMangaDex<MangaResponse>(`/manga?${params}`)
  return { data: data.data, total: data.total }
}

export async function searchManga(
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ data: Manga[]; total: number }> {
  const params = createMangaParams()
  params.set("limit", String(limit))
  params.set("offset", String((page - 1) * limit))
  params.set("title", query)

  const data = await fetchMangaDex<MangaResponse>(`/manga?${params}`)
  return { data: data.data, total: data.total }
}

export async function getManga(id: string): Promise<Manga> {
  const params = new URLSearchParams()
  params.append("includes[]", "cover_art")
  params.append("includes[]", "author")
  params.append("includes[]", "artist")

  const data = await fetchMangaDex<SingleMangaResponse>(
    `/manga/${id}?${params}`
  )
  return data.data
}

export async function getMangaIdBySlug(
  slug: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    "limit": "10",
    "availableTranslatedLanguage[]": "pt-br",
    "includes[]": "cover_art",
  })

  const data = await fetchMangaDex<MangaResponse>(`/manga?${params}`)
  const match = data.data.find(m => {
    const title = m.attributes.title["pt-br"]
      || m.attributes.title.en
      || Object.values(m.attributes.title)[0]
    if (!title) return false
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") === slug
  })

  return match?.id || null
}

export async function getChapters(
  mangaId: string,
  limit: number = 500,
): Promise<Chapter[]> {
  const params = new URLSearchParams({
    "translatedLanguage[]": "pt-br",
    "order[chapter]": "desc",
    "limit": String(limit),
    "includes[]": "scanlation_group",
  })

  const data = await fetchMangaDex<ChapterResponse>(
    `/manga/${mangaId}/feed?${params}`
  )
  return data.data
}

export async function getChapterPages(
  chapterId: string,
): Promise<AtHomeResponse["chapter"] & { baseUrl: string }> {
  const data = await fetchMangaDex<AtHomeResponse>(
    `/at-home/server/${chapterId}`
  )
  return {
    baseUrl: data.baseUrl,
    ...data.chapter,
  }
}

export async function getCover(id: string): Promise<string | null> {
  try {
    const data = await fetchMangaDex<CoverResponse>(`/cover/${id}`)
    return data.data.attributes.fileName
  } catch {
    return null
  }
}

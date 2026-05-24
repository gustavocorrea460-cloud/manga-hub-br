import { load } from "cheerio"
import type {
  MangaFireSearchResponse,
  MangaFireSearchResult,
  MangaFireManga,
  MangaFireChapter,
} from "@/types/mangafire"

const BASE = "https://mangafire.to"
const TIMEOUT = 15000

const headers: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
}

async function fetchPage(path: string): Promise<string> {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) {
    throw new Error(`MangaFire fetch error: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

export async function searchManga(
  query: string,
  page: number = 1,
): Promise<MangaFireSearchResponse> {
  const html = await fetchPage(`/filter?keyword=${encodeURIComponent(query)}&page=${page}`)
  const $ = load(html)

  const results: MangaFireSearchResult[] = []
  $("div.original.card-lg > div.unit").each((_, el) => {
    const link = $(el).find("a.poster")
    const href = link.attr("href") || ""
    results.push({
      id: href.replace("/manga/", "") || null,
      title: $(el).find("div.info > a").text().trim() || null,
      poster: $(el).find("a.poster > div > img").attr("src")?.trim() || null,
      type: $(el).find("div.info > div > span.type").text().trim() || null,
    })
  })

  let totalPages = 0
  $("ul.pagination > li.page-item > a").each((_, el) => {
    const num = parseInt($(el).text())
    if (!isNaN(num) && num > totalPages) totalPages = num
  })

  if (totalPages === 0 && results.length > 0) totalPages = 1

  return { currentPage: page, totalPages, results }
}

export async function getManga(id: string): Promise<MangaFireManga> {
  const html = await fetchPage(`/manga/${id}`)
  const $ = load(html)

  return {
    title: $('h1[itemprop="name"]').text().trim() || null,
    altTitles: $('h1[itemprop="name"]').siblings("h6").text().trim() || null,
    poster: $(".poster img").attr("src")?.trim() || null,
    status: $(".info > p").first().text().trim() || null,
    type: $(".min-info a").first().text().trim() || null,
    description: $(".description").text().replace("Read more +", "").trim() || null,
    author: $('.meta div:contains("Author:") a').text().trim() || null,
    published: $('.meta div:contains("Published:")')
      .text()
      .replace("Published:", "")
      .trim() || null,
    genres: $('.meta div:contains("Genres:") a')
      .map((_, el) => $(el).text().trim())
      .get(),
    rating: $(".rating-box .live-score").text().trim() || null,
  }
}

export async function getChapters(
  mangaId: string,
  language: string = "en",
): Promise<MangaFireChapter[]> {
  const numericId = mangaId.match(/(\d+)/)?.[1]
  if (!numericId) throw new Error(`Invalid MangaFire ID: ${mangaId}`)

  const url = `${BASE}/ajax/read/${numericId}/chapter/${language}`
  const res = await fetch(url, {
    headers: { ...headers, "X-Requested-With": "XMLHttpRequest" },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error(`MangaFire AJAX error: ${res.status}`)

  const json: { result: { html: string } } = await res.json()
  const $ = load(json.result.html)
  const chapters: MangaFireChapter[] = []

  $("li").each((_, li) => {
    const a = $(li).find("a")
    chapters.push({
      number: a.attr("data-number") ?? "",
      title: a.find("span:first-child").text().trim() || null,
      chapterId: a.attr("data-id") ?? "",
      language,
      releaseDate: a.find("span:last-child").text().trim() || null,
    })
  })

  return chapters
}

export async function getChapterImages(chapterId: string): Promise<string[]> {
  const url = `${BASE}/ajax/read/chapter/${chapterId}`
  const res = await fetch(url, {
    headers: { ...headers, "X-Requested-With": "XMLHttpRequest" },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error(`MangaFire chapter error: ${res.status}`)

  const json: { result: { images: string[][] } } = await res.json()
  return json.result.images.map((img) => img[0])
}

export function getCoverUrl(manga: { poster: string | null }): string | null {
  if (!manga.poster) return null
  if (manga.poster.startsWith("http")) return manga.poster
  return `https:${manga.poster}`
}

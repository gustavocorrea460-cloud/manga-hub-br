import { load } from "cheerio"
import type {
  LeituraMangaSearchResult,
  LeituraMangaManga,
  LeituraMangaChapter,
} from "@/types/leiturmanga"

const BASE = "https://leituramanga.net"
const CDN = "https://cdn.leituramanga.net"
const TIMEOUT = 20000

const headers: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: "https://leituramanga.net/",
}

async function fetchPage(path: string): Promise<string> {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) {
    throw new Error(`LeituraManga fetch error: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

export async function searchManga(
  _query: string,
): Promise<LeituraMangaSearchResult[]> {
  return []
}

export async function getLatestMangas(
  page: number = 1,
): Promise<{ mangas: LeituraMangaSearchResult[]; totalPages: number }> {
  const html = await fetchPage(`/latest?page=${page}`)
  const $ = load(html)
  const mangas: LeituraMangaSearchResult[] = []

  $("a[href*='/manga/']").each((_, el) => {
    const href = $(el).attr("href") || ""
    if (!href.startsWith("/manga/") || href.includes("/chapter/")) return

    const title = $(el).find("h3").first().text().trim() || $(el).attr("title") || ""
    if (!title) return

    const coverUrl =
      $(el).find("img").attr("src")?.trim() ||
      $(el).find("img").attr("data-src")?.trim() ||
      null

    const slug = href.replace("/manga/", "").replace(/\/$/, "")
    const latestChapterEl = $(el).find("a[href*='/chapter/']").first()
    const latestChapter = latestChapterEl.text().trim().match(/(\d+(?:\.\d+)?)/)?.[1] || null

    mangas.push({ id: slug, title, coverUrl, latestChapter })
  })

  let totalPages = page
  $("a[href*='page=']").each((_, el) => {
    const num = parseInt($(el).text())
    if (!isNaN(num) && num > totalPages) totalPages = num
  })

  if (mangas.length > 0 && totalPages === page) {
    const navText = $("nav, .pagination, [class*='pagination']").text()
    const lastMatch = navText.match(/(\d+)\s*$/)
    if (lastMatch) {
      const n = parseInt(lastMatch[1])
      if (n > totalPages) totalPages = n
    }
  }

  return { mangas, totalPages }
}

export async function getManga(slug: string): Promise<LeituraMangaManga> {
  const html = await fetchPage(`/manga/${slug}/`)
  const $ = load(html)

  const title =
    $("h1").first().text().trim() ||
    $(`meta[property="og:title"]`).attr("content")?.replace(/ - .*$/, "").trim() ||
    slug

  const coverUrl =
    $(`img[src*="${CDN}/${slug}/"]`).first().attr("src")?.trim() ||
    $(`meta[property="og:image"]`).attr("content")?.trim() ||
    null

  const pageText = $("body").text()

  let status: string | null = null
  const statusMatch = pageText.match(/Status\s*:\s*([^\n]{2,30}?)(?:Autor|Gêneros|$)/i)
  if (statusMatch) {
    status = statusMatch[1].replace(/\s+/g, " ").trim()
  }

  let author: string | null = null
  const authorMatch = pageText.match(/Autor\s*:\s*([^\n]{2,30}?)(?:Status|$)/i)
  if (authorMatch) {
    author = authorMatch[1].replace(/\s+/g, " ").trim()
  }

  const genres: string[] = []
  $('a[href*="/genre/"], [class*="genre"] a').each((_, el) => {
    const g = $(el).text().trim()
    if (
      g &&
      g.length < 30 &&
      !genres.includes(g) &&
      !["+18", "Gêneros"].includes(g)
    ) {
      genres.push(g)
    }
  })

  let year: string | null = null
  const yearMatch = pageText.match(/datePublished["\s:]+"(\d{4})/)
  if (yearMatch) {
    year = yearMatch[1]
  }
  if (!year) {
    const yearMeta = $(`meta[property="article:published_time"]`).attr("content")
    if (yearMeta) {
      year = yearMeta.slice(0, 4)
    }
  }

  let description: string | null = null
  const synopsisMatch = pageText.match(/(?:Sinopse|Sinopsis|Description)\s*\n*\s*([\s\S]{100,}?)(?:\n\s*(?:Atualizado|Status|Capítulos|Gêneros))/i)
  if (synopsisMatch) {
    description = synopsisMatch[1].trim()
  }
  if (!description) {
    description =
      $(`meta[name="description"]`).attr("content")?.trim() || null
  }

  let firstChapter: string | null = null
  let lastChapter: string | null = null

  $("a[href*='/chapter/']").each((_, el) => {
    const href = $(el).attr("href") || ""
    const num = href.match(/\/chapter\/(\d+(?:\.\d+)?)/)?.[1]
    if (!num) return

    const text = $(el).text().trim().toLowerCase()
    if (text.includes("primeiro") || text.includes("first")) {
      firstChapter = num
    }
    if (text.includes("último") || text.includes("ultimo") || text.includes("last")) {
      lastChapter = num
    }
  })

  if (!firstChapter && !lastChapter) {
    $("a[href*='/manga/']").each((_, el) => {
      const href = $(el).attr("href") || ""
      if (!href.includes(slug) || !href.includes("/chapter/")) return
      const num = href.match(/\/chapter\/(\d+(?:\.\d+)?)/)?.[1]
      if (!num) return
      if (!firstChapter || parseFloat(num) < parseFloat(firstChapter)) firstChapter = num
      if (!lastChapter || parseFloat(num) > parseFloat(lastChapter)) lastChapter = num
    })
  }

  return { title, coverUrl, status, author, year, genres, description, firstChapter, lastChapter }
}

export async function getChapters(slug: string): Promise<LeituraMangaChapter[]> {
  const manga = await getManga(slug)

  if (!manga.firstChapter && !manga.lastChapter) {
    return []
  }

  const first = parseFloat(manga.firstChapter || manga.lastChapter || "1")
  const last = parseFloat(manga.lastChapter || manga.firstChapter || "1")

  if (last < first) {
    return []
  }

  const range = Math.min(Math.ceil(last) - Math.floor(first) + 1, 500)
  if (range > 500) {
    return [
      {
        number: manga.firstChapter || String(first),
        title: null,
        chapterId: `/manga/${slug}/chapter/${manga.firstChapter}/`,
        date: null,
      },
      {
        number: manga.lastChapter || String(last),
        title: null,
        chapterId: `/manga/${slug}/chapter/${manga.lastChapter}/`,
        date: null,
      },
    ]
  }

  const chapters: LeituraMangaChapter[] = []
  const start = Math.floor(first)
  const count = Math.ceil(last) - start + 1

  for (let i = 0; i < count; i++) {
    const num = start + i
    const numStr = String(num)
    chapters.push({
      number: numStr,
      title: null,
      chapterId: `/manga/${slug}/chapter/${numStr}/`,
      date: null,
    })
  }

  return chapters.reverse()
}

export async function getChapterImages(
  slug: string,
  chapterNumber: string,
): Promise<string[]> {
  const html = await fetchPage(`/manga/${slug}/chapter/${chapterNumber}/`)
  const $ = load(html)

  const seenPages = new Set<number>()
  const images: string[] = []

  $(`img[src*="${CDN}"]`).each((_, el) => {
    const src = $(el).attr("src")?.trim()
    if (!src) return

    const pageMatch = src.match(/page-\w+-(\d+)\.webp$/)
    if (!pageMatch) return

    const pageNum = parseInt(pageMatch[1])
    if (seenPages.has(pageNum)) return
    seenPages.add(pageNum)

    images.push(src)
  })

  return images.sort((a, b) => {
    const na = parseInt(a.match(/page-\w+-(\d+)\.webp$/)?.[1] || "0")
    const nb = parseInt(b.match(/page-\w+-(\d+)\.webp$/)?.[1] || "0")
    return na - nb
  })
}

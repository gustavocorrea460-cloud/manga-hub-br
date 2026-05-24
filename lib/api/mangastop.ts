import { load } from "cheerio"
import type { MangaStopSearchResult, MangaStopManga, MangaStopChapter } from "@/types/mangastop"

const BASE = "https://mangastop.net"
const ORIGIN_CDN = "https://comick.jeffersondev.xyz"
const TIMEOUT = 20000

const headers: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: "https://mangastop.net/",
}

async function fetchPage(path: string): Promise<string> {
  const url = `${BASE}${path}`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) {
    throw new Error(`MangaStop fetch error: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

function extractSlugFromUrl(url: string): string {
  url = url.replace(BASE, "")
  const m = url.match(/\/manga\/([^/]+)\/?$/)
  if (m) return m[1]
  const m2 = url.match(/\/(.+?)-capitulo-\d+\/?$/)
  if (m2) return m2[1]
  const cleaned = url.replace(/^\//, "").replace(/\/$/, "")
  return cleaned.split("/")[0] || cleaned
}

export async function searchManga(
  query: string,
  _page: number = 1,
): Promise<MangaStopSearchResult[]> {
  const html = await fetchPage(`/?s=${encodeURIComponent(query)}`)
  const $ = load(html)

  const results: MangaStopSearchResult[] = []
  const seen = new Set<string>()

  $("a[href*='/manga/']").each((_, el) => {
    const href = $(el).attr("href") || ""
    if (!href.startsWith(BASE + "/manga/") && !href.startsWith("/manga/")) return

    const fullUrl = href.startsWith("http") ? href : `${BASE}${href}`
    if (seen.has(fullUrl)) return
    seen.add(fullUrl)

    const title = $(el).text().trim()
    if (!title || title.length < 2) return

    const slug = extractSlugFromUrl(href)
    const coverUrl = $(el).find("img").attr("src") || null

    results.push({ id: slug, title, coverUrl })
  })

  if (results.length === 0) {
    $("article img[src*='images.mangastop.net'], article img[src*='comick.jeffersondev.xyz']").each((_, el) => {
      const img = $(el).closest("a") || $(el).parent()
      const link = img.is("a") ? img : $(el).closest("a")
      const href = link.attr("href") || ""
      if (!href.includes("/manga/")) return

      const slug = extractSlugFromUrl(href)
      if (seen.has(slug)) return
      seen.add(slug)

      const title = link.find("h3, h4, h5, .title, [class*='title']").first().text().trim()
        || link.attr("title") || slug
      const coverUrl = $(el).attr("src") || null

      results.push({ id: slug, title, coverUrl })
    })
  }

  return results
}

export async function getManga(slug: string): Promise<MangaStopManga> {
  const html = await fetchPage(`/manga/${slug}/`)
  const $ = load(html)

  const title = $("h1").first().text().trim()
    || $('meta[property="og:title"]').attr("content")?.trim()
    || slug

  const coverUrl =
    $("div.summary_image img, .thumb img, .poster img, article img[src*='images.mangastop.net']").first().attr("src")?.trim()
    || $('meta[property="og:image"]').attr("content")?.trim()
    || null

  const status = $('div.post-status div:contains("Status") span, .status span, [class*="status"] span')
    .first().text().trim() || null

  const type = $('div.post-status div:contains("Type") span, .type span, [class*="type"] span')
    .first().text().trim() || null

  const year = $('div.post-status div:contains("Year") span, .year span, [class*="year"] span')
    .first().text().trim() || null

  let author: string | null = null
  const authorText = $("body").text()
  const authorMatch = authorText.match(/Autor(?:es)?[:\s]+([^\n]+?)(?:Artista|$)/i)
  if (authorMatch) {
    author = authorMatch[1].trim().replace(/\s+/g, " ")
  }

  const genres: string[] = []
  $("a[href*='/manga/?genre='], a[href*='?genre='], .genres a, .tags a, [class*='genre'] a, .genres-links a, .genres-content a").each((_, el) => {
    const g = $(el).text().trim()
    if (g && g.length < 50 && !genres.includes(g)) {
      genres.push(g)
    }
  })

  let description: string | null = null
  $('div[class*="description"], div[class*="summary"], div[class*="synopsis"], p[class*="description"], .summary, .synopsis').each((_, el) => {
    const text = $(el).text().replace(/Read more\+?/g, "").replace(/Sinopse/i, "").trim()
    if (text.length > 50) {
      description = text
    }
  })

  if (!description) {
    const bodyText = $("body").text()
    const synMatch = bodyText.match(/(?:Sinopse|Sinopsis|Description|Synopsis)\s*\n*\s*([\s\S]{100,}?)(?:\n\s*(?:Atualizado|Status|Tracking|Plataforma|Gêneros))/i)
    if (synMatch) {
      description = synMatch[1].trim()
    }
  }

  return { title, coverUrl, status, type, author, year, genres, description }
}

export async function getChapters(slug: string): Promise<MangaStopChapter[]> {
  const html = await fetchPage(`/manga/${slug}/`)
  const $ = load(html)

  const chapters: MangaStopChapter[] = []

  $("ul.clstyle li, .eplister li, .chapter-list li, [class*='chapter'] li, .listing li").each((_, el) => {
    const link = $(el).find("a").first()
    const href = link.attr("href") || ""
    if (!href) return

    const fullUrl = href.startsWith("http") ? href.replace(BASE, "") : href
    if (!fullUrl.includes("capitulo")) return

    const text = link.text().trim()
    const numMatch = text.match(/(?:Cap[íi]tulo|Ch\.?|Chapter)\s*(\d+(?:\.\d+)?)/i)
    const number = numMatch ? numMatch[1] : (fullUrl.match(/-capitulo-(\d+(?:\.\d+)?)/)?.[1] || "0")

    const titlePart = text.replace(/Cap[íi]tulo\s*\d+(?:\s*-\s*)?/i, "").trim() || null
    const date = $(el).find(".date, .chapterdate, time, [datetime]").first().text().trim()
      || $(el).find("span:last-child").text().trim()
      || null

    chapters.push({ number, title: titlePart, chapterId: fullUrl, date })
  })

  if (chapters.length === 0) {
    $("a[href*='-capitulo-']").each((_, el) => {
      const href = $(el).attr("href") || ""
      const fullUrl = href.startsWith("http") ? href.replace(BASE, "") : href
      if (!fullUrl.includes("capitulo")) return

      const text = $(el).text().trim()
      const numMatch = text.match(/(?:Cap[íi]tulo|Ch\.?|Chapter)\s*(\d+(?:\.\d+)?)/i)
      const number = numMatch ? numMatch[1] : (fullUrl.match(/-capitulo-(\d+(?:\.\d+)?)/)?.[1] || "0")
      const titlePart = text.replace(/Cap[íi]tulo\s*\d+(?:\s*-\s*)?/i, "").trim() || null

      chapters.push({ number, title: titlePart, chapterId: fullUrl, date: null })
    })
  }

  return chapters
}

export async function getChapterImages(chapterUrlPath: string): Promise<string[]> {
  const url = chapterUrlPath.startsWith("http")
    ? chapterUrlPath
    : `${BASE}${chapterUrlPath}`
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) })
  if (!res.ok) throw new Error(`MangaStop chapter error: ${res.status}`)

  const html = await res.text()

  const configMatch = html.match(/_ts_internal_config\s*=\s*({[\s\S]*?});/)
  if (!configMatch) {
    throw new Error("MangaStop: _ts_internal_config not found in chapter page")
  }

  let config: { sources?: { images?: string[] }[] }
  try {
    config = JSON.parse(configMatch[1])
  } catch {
    throw new Error("MangaStop: failed to parse _ts_internal_config")
  }

  const sources = config.sources
  if (!sources || sources.length === 0) {
    throw new Error("MangaStop: no sources found in _ts_internal_config")
  }

  const images = sources[0].images
  if (!images || images.length === 0) {
    throw new Error("MangaStop: no images found in source")
  }

  const decodedUrls: string[] = []
  for (const img of images) {
    const tokenMatch = img.match(/[?&]_token=([^&]+)/)
    if (tokenMatch) {
      try {
        const decoded = atob(tokenMatch[1])
        if (decoded.startsWith("http")) {
          decodedUrls.push(decoded)
          continue
        }
      } catch {
        // fall through to raw URL
      }
    }
    if (img.startsWith(ORIGIN_CDN) || img.includes("jeffersondev")) {
      decodedUrls.push(img)
    } else {
      const tokenParam = img.match(/_token=([^&]+)/)?.[1]
      if (tokenParam) {
        try {
          const decoded = atob(tokenParam)
          if (decoded.startsWith("http")) {
            decodedUrls.push(decoded)
          } else {
            decodedUrls.push(img)
          }
        } catch {
          decodedUrls.push(img)
        }
      } else {
        decodedUrls.push(img)
      }
    }
  }

  return decodedUrls
}

import { load } from "cheerio"
import type { QueroLerManga, QueroLerChapter } from "@/types/queroler"

const BASE = "https://queroler.com"
const TIMEOUT = 15000
const MIN_REQUEST_GAP_MS = 800
const MAX_RETRIES = 1
const ADBLOCK_KEYWORDS = [
  "adblock",
  "desative o adblock",
  "desative seu bloqueador",
  "habilite o javascript",
  "ativar o javascript",
]

const headers: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: "https://queroler.com/",
}

let lastRequestTime = 0

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function rateLimitedFetch(url: string, fetchOpts: RequestInit): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await delay(MIN_REQUEST_GAP_MS - elapsed)
  }
  lastRequestTime = Date.now()
  return fetch(url, { ...fetchOpts, signal: AbortSignal.timeout(TIMEOUT) })
}

function isAdblocked(html: string): boolean {
  const lower = html.toLowerCase()
  return ADBLOCK_KEYWORDS.some(kw => lower.includes(kw)) && html.includes("script") === false
}

async function fetchPageWithRetry(path: string, attempt: number = 0): Promise<string> {
  const url = `${BASE}${path}`
  const res = await rateLimitedFetch(url, { headers })
  if (!res.ok) {
    throw new Error(`QueroLer fetch error: ${res.status} ${res.statusText}`)
  }
  const html = await res.text()

  if (isAdblocked(html)) {
    console.warn(`[QueroLer] Possível bloqueio Adblock detectado em: ${path}`)
    if (attempt < MAX_RETRIES) {
      console.warn(`[QueroLer] Retentando em 2s... (tentativa ${attempt + 1}/${MAX_RETRIES})`)
      await delay(2000)
      return fetchPageWithRetry(path, attempt + 1)
    }
    console.warn(`[QueroLer] Retry esgotado para: ${path}`)
  }

  return html
}

async function fetchPage(path: string): Promise<string> {
  return fetchPageWithRetry(path)
}

async function fetchJSON(path: string): Promise<Record<string, unknown>> {
  const url = `${BASE}${path}`
  const res = await rateLimitedFetch(url, {
    headers: { ...headers, Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`QueroLer JSON fetch error: ${res.status}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

export async function searchManga(
  query: string,
): Promise<{ id: string; title: string; coverUrl: string | null; author: string | null }[]> {
  const html = await fetchPage(`/manga/?query=${encodeURIComponent(query)}`)
  const $ = load(html)
  const results: { id: string; title: string; coverUrl: string | null; author: string | null }[] = []

  $("div.manga-card").each((_, el) => {
    const link = $(el).find("a.manga-card-cover").first()
    const href = link.attr("href") || ""
    const uuidMatch = href.match(/\/manga\/([a-f0-9-]+)\//)
    if (!uuidMatch) return

    const id = uuidMatch[1]
    const img = link.find("img").first()
    const coverUrl = img.attr("src")?.trim() || null

    const titleEl = $(el).find("h3.manga-card-title").first()
    const title = titleEl.text().trim()

    const authorEl = $(el).find("p.manga-card-author").first()
    const author = authorEl.text().trim() || null

    if (title) {
      results.push({ id, title, coverUrl: coverUrl ? `https://queroler.com${coverUrl}` : null, author })
    }
  })

  return results
}

export async function getManga(uuid: string): Promise<QueroLerManga> {
  const html = await fetchPage(`/manga/${uuid}/`)
  const $ = load(html)

  const title = $("h1.font-serif").first().text().trim() ||
    $(`meta[property="og:title"]`).attr("content")?.replace(/ - .*$/, "").trim() ||
    uuid

  const coverImg = $("div.manga-detail-cover img").first()
  const coverSrc = coverImg.attr("src") || ""
  const coverUrl = coverSrc ? `https://queroler.com${coverSrc}` : null

  let status: string | null = null
  $("div.manga-detail-info span.pill").each((_, el) => {
    const text = $(el).text().trim().toLowerCase()
    if (["em andamento", "completo", "hiato", "cancelado", "ongoing", "completed"].some(s => text.includes(s))) {
      status = $(el).text().trim()
    }
  })

  let author: string | null = null
  const authorDiv = $("div.manga-detail-info div:contains('Autor:')").first()
  if (authorDiv.length) {
    const authorSpan = authorDiv.find("span").last()
    author = authorSpan.text().trim() || null
  }

  let year: string | null = null
  $("div.manga-detail-info span.pill").each((_, el) => {
    const text = $(el).text().trim()
    if (/^\d{4}$/.test(text)) {
      year = text
    }
  })

  const genres: string[] = []
  const genreDiv = $("div.manga-detail-info div:has(span.pill-info)").first()
  if (genreDiv.length) {
    genreDiv.find("span.pill-info").each((_, el) => {
      const g = $(el).text().trim()
      if (g) genres.push(g)
    })
  }

  let description: string | null = null
  const descEl = $("div.manga-description").first()
  if (descEl.length) {
    description = descEl.text().trim()
  }
  if (!description) {
    description = $(`meta[name="description"]`).attr("content")?.trim() || null
  }

  const altTitles: string[] = []
  const altEl = $("div.manga-detail-info div:contains('Também conhecido como')").first()
  if (altEl.length) {
    altEl.find("span").each((_, el) => {
      const t = $(el).text().trim()
      if (t) altTitles.push(t)
    })
  }

  return { title, coverUrl, status, author, year, genres, description, altTitles }
}

export async function getChapters(uuid: string): Promise<QueroLerChapter[]> {
  const chapters: QueroLerChapter[] = []

  const html = await fetchPage(`/manga/${uuid}/`)
  const $ = load(html)

  const totalText = $("span.pill.pill-green").first().text().trim()
  const totalMatch = totalText.match(/(\d+)/)
  const totalChapters = totalMatch ? parseInt(totalMatch[1]) : 0

  const htmlChapters: { num: string; title: string; id: string; group: string }[] = []
  $("#chapters-body tr").each((_, row) => {
    const num = $(row).find("td").first().text().trim()
    const title = $(row).find("td").eq(1).text().trim()
    const chapterId = $(row).find("button.download-chapter-btn").attr("data-chapter-id") || ""
    const group = $(row).find("td").eq(4).text().trim()

    if (num && chapterId) {
      htmlChapters.push({ num, title, id: chapterId, group })
      chapters.push({
        id: chapterId,
        number: num,
        title: title || null,
        date: null,
        pdfUrl: `/manga/download/${chapterId}/`,
      })
    }
  })

  if (totalChapters > htmlChapters.length) {
    const pagesNeeded = Math.ceil((totalChapters - htmlChapters.length) / 60) + 1
    for (let page = 2; page <= pagesNeeded + 1; page++) {
      try {
        const apiData = await fetchJSON(`/manga/${uuid}/capitulos/?page=${page}`)
        const chs = apiData.chapters as Array<{
          id?: string
          numero?: number
          titulo?: string
          chapter_id?: string
        }> | undefined

        if (!chs || chs.length === 0) break

        for (const c of chs) {
          const num = c.numero ?? c.id ?? ""
          const chId = c.chapter_id ?? c.id ?? ""
          if (num && chId) {
            chapters.push({
              id: chId,
              number: String(num),
              title: c.titulo || null,
              date: null,
              pdfUrl: `/manga/download/${chId}/`,
            })
          }
        }
      } catch {
        break
      }
    }
  }

  return chapters.sort((a, b) => parseFloat(b.number) - parseFloat(a.number))
}

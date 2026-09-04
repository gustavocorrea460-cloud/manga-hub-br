import { getOrionCrypto, decryptJsonResponse } from "./orion"
import type {
  NexusManga,
  NexusChapter,
  NexusPage,
  NexusSearchResponse,
  NexusMangaDetailResponse,
  NexusChapterDetail,
} from "@/types/nexustoons"

/**
 * Cliente da API pública do Nexustoons.com (reversão 2026-09-04).
 *
 * API self-hosted (Express + Cloudflare). Endpoints públicos (sem auth):
 *   GET /api/mangas?q={query}&limit=10         → busca paginada
 *   GET /api/manga/{slug}                       → detalhes + capítulos (criptografado)
 *   GET /api/chapter/{id}                       → dados do capítulo (criptografado)
 *   GET /api/read/{id}                          → páginas (criptografado)
 *
 * Respostas criptografadas { d, k, v } → decriptadas via OrionCrypto (lib/api/orion.ts).
 * CDN de imagens: img.nx-toons.xyz (sem hotlink protection).
 */

const BASE = "https://nexustoons.com"
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Referer: `${BASE}/`,
}

async function fetchJson<T>(path: string, customHeaders?: Record<string, string>): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { ...HEADERS, ...customHeaders },
      signal: controller.signal,
      cache: "no-store",
    })
    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`Nexus API ${path} → ${res.status} ${res.statusText}`)
    }
    return await decryptJsonResponse<T>(res)
  } finally {
    clearTimeout(timeout)
  }
}

/** Busca paginada por texto — retorna { data, total } */
export async function searchManga(query: string, page: number = 1): Promise<{ data: NexusManga[]; total: number }> {
  const res = await fetchJson<NexusSearchResponse>(`/api/mangas?q=${encodeURIComponent(query)}&limit=24&page=${page}`)
  return { data: res.data ?? [], total: res.total ?? 0 }
}

/** Detalhes de um mangá por slug (inclui capítulos e categorias) */
export async function getManga(slug: string): Promise<NexusMangaDetailResponse> {
  return fetchJson<NexusMangaDetailResponse>(`/api/manga/${slug}`)
}

/** Lista de capítulos de um mangá (do payload de detalhes) */
export function extractChapters(detail: NexusMangaDetailResponse): NexusChapter[] {
  return (detail.chapters ?? []).sort((a, b) => {
    const an = parseFloat(a.number) || 0
    const bn = parseFloat(b.number) || 0
    return bn - an
  })
}

/** Páginas de um capítulo — via /api/read/{id} (criptografado) */
export async function getChapterPages(chapterId: number | string): Promise<NexusPage[]> {
  const detail = await fetchJson<NexusChapterDetail>(`/api/read/${chapterId}`)
  return (detail.pages ?? []).sort((a, b) => a.pageNumber - b.pageNumber)
}

/** Sangria de slug a partir de URL do site */
export function extractSlug(urlOrSlug: string): string {
  const m = urlOrSlug.match(/\/manga\/([^/?#]+)/)
  return m ? m[1] : urlOrSlug
}

export { getOrionCrypto }

import type { SourceId } from "@/lib/sources"
import { findMangaByTitle } from "@/lib/db"
import {
  searchMangaFireCached,
  searchMangaStopCached,
  searchLeituraMangaCached,
  getMangaFireCached,
  getMangaStopCached,
  getLeituraMangaCached,
  getMangaFireChaptersCached,
  getMangaStopChaptersCached,
  getLeituraMangaChaptersCached,
} from "@/lib/cache"
import { searchMangaWithFilters } from "@/lib/api/mangadex"

export interface FallbackSearchResult {
  id: string
  title: string
  coverUrl: string | null
  type: string | null
  source: SourceId
}

export interface CatalogReference {
  source: SourceId
  slug: string
  title: string
  coverUrl: string | null
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a)
  const nb = normalizeTitle(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.9
  let matches = 0
  for (const char of na) {
    if (nb.includes(char)) matches++
  }
  return matches / Math.max(na.length, nb.length, 1)
}

export async function searchAllSources(
  query: string,
  page: number = 1,
): Promise<{ data: FallbackSearchResult[]; total: number }> {
  const [md, mf, ms, llm] = await Promise.allSettled([
    searchMangaWithFilters({ q: query, page, limit: 30 }).then(r =>
      r.data.map(m => {
        const title =
          m.attributes.title["pt-br"] ||
          m.attributes.title.en ||
          Object.values(m.attributes.title)[0] ||
          "Sem título"
        const coverRel = m.relationships.find(r => r.type === "cover_art")
        const fileName = coverRel?.attributes
          ? (coverRel.attributes as { fileName?: string }).fileName
          : undefined
        return {
          id: m.id,
          title,
          coverUrl: fileName
            ? `https://uploads.mangadex.org/covers/${m.id}/${fileName}.256.jpg`
            : null,
          type: null,
          source: "mangadex" as SourceId,
        }
      }),
    ),
    searchMangaFireCached(query, page).then(r =>
      r.results.map(r => ({
        id: r.id || "",
        title: r.title || "Sem título",
        coverUrl: r.poster,
        type: r.type,
        source: "mangafire" as SourceId,
      })),
    ),
    searchMangaStopCached(query).then(r =>
      r.map(r => ({
        id: r.id,
        title: r.title,
        coverUrl: r.coverUrl,
        type: "mangastop" as SourceId,
        source: "mangastop" as SourceId,
      })),
    ),
    searchLeituraMangaCached(query).then(r =>
      r.map(r => ({
        id: r.id,
        title: r.title,
        coverUrl: r.coverUrl,
        type: null,
        source: "leiturmanga" as SourceId,
      })),
    ),
    // QueroLer removido do searchAllSources (down desde 2026-09-04 — ver discovery)
  ])

  const allResults: FallbackSearchResult[] = []
  if (md.status === "fulfilled") allResults.push(...md.value)
  if (mf.status === "fulfilled") allResults.push(...mf.value)
  if (ms.status === "fulfilled") allResults.push(...ms.value)
  if (llm.status === "fulfilled") allResults.push(...llm.value)

  const deduplicated = deduplicateResults(allResults)
  return { data: deduplicated, total: deduplicated.length }
}

export function deduplicateResults(results: FallbackSearchResult[]): FallbackSearchResult[] {
  const groups: { normalized: string; items: FallbackSearchResult[] }[] = []

  for (const r of results) {
    const norm = normalizeTitle(r.title)
    let found = false
    for (const g of groups) {
      if (titleSimilarity(g.normalized, norm) > 0.85) {
        g.items.push(r)
        found = true
        break
      }
    }
    if (!found) {
      groups.push({ normalized: norm, items: [r] })
    }
  }

  return groups.map(g => {
    const hasCover = g.items.find(i => i.coverUrl)
    const hasType = g.items.find(i => i.type)
    // MangaDex results are usually most complete
    const best = g.items.find(i => i.source === "mangadex") ||
      g.items.find(i => i.source === "mangastop") ||
      g.items.find(i => i.source === "mangafire") ||
      g.items.find(i => i.source === "leiturmanga") ||
      g.items.find(i => i.source === "queroler") ||
      g.items[0]
    return {
      ...best,
      coverUrl: best.coverUrl || hasCover?.coverUrl || null,
      type: best.type || hasType?.type || null,
    }
  })
}

export async function findEquivalentManga(
  title: string,
  source: string,
): Promise<CatalogReference | null> {
  const entries = await findMangaByTitle(title)
  const target = entries.find(e => e.source !== source) || entries[0]
  if (!target) return null
  const meta = target.metadata as Record<string, unknown> | undefined
  return {
    source: target.source as SourceId,
    slug: target.slug,
    title: target.title,
    coverUrl: (meta?.coverUrl as string) || null,
  }
}

export async function findAlternativesForReader(
  mangaTitle: string,
  chapterNumber: string,
  currentSource: string,
): Promise<{ source: SourceId; chapterId: string; label: string }[]> {
  const alternatives: { source: SourceId; chapterId: string; label: string }[] = []
  const entries = await findMangaByTitle(mangaTitle)

  for (const entry of entries) {
    if (entry.source === currentSource) continue
    const source = entry.source as SourceId

    try {
      let chapters: { number: string; id: string }[] = []

      if (source === "mangafire") {
        const chs = await getMangaFireChaptersCached(entry.slug, "en")
        chapters = chs.map(c => ({ number: c.number, id: c.chapterId }))
      } else if (source === "mangastop") {
        const chs = await getMangaStopChaptersCached(entry.slug)
        chapters = chs.map(c => ({ number: c.number, id: c.chapterId }))
      } else if (source === "leiturmanga") {
        const chs = await getLeituraMangaChaptersCached(entry.slug)
        chapters = chs.map(c => ({ number: c.number, id: `${entry.slug}:${c.number}` }))
      } else if (source === "queroler") {
        continue
      }

      const match = chapters.find(c => {
        const cn = parseFloat(c.number)
        const en = parseFloat(chapterNumber)
        return !isNaN(cn) && !isNaN(en) && cn === en
      })

      if (match) {
        alternatives.push({
          source,
          chapterId: match.id,
          label: source === "mangafire"
            ? "MangaFire"
            : source === "mangastop"
              ? "MangaStop"
              : source === "leiturmanga"
                ? "LeituraManga"
                : "QueroLer",
        })
      }
    } catch {
      // skip unavailable sources
    }
  }

  return alternatives
}

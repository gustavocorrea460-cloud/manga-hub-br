import type { CardManga } from "@/components/MangaCard"
import type { SourceId } from "@/components/SourceBadge"
import type { Manga } from "@/types/mangadex"
import type { MangaFireSearchResult } from "@/types/mangafire"
import type { MangaStopSearchResult } from "@/types/mangastop"
import type { NexusManga } from "@/types/nexustoons"
import { getTitle, getCoverUrl, getStatusLabel } from "@/types/mangadex"

/**
 * Mapeadores para converter cada formato de fonte → CardManga
 * (formato universal consumido por MangaCard).
 */

export function fromMangaDex(m: Manga, source: SourceId = "mangadex"): CardManga {
  return {
    id: m.id,
    title: getTitle(m),
    coverUrl: getCoverUrl(m, "256"),
    source,
    type: null,
    status: getStatusLabel(m.attributes.status),
    updatedAt: m.attributes.updatedAt,
  }
}

export function fromMangaFire(r: MangaFireSearchResult, source: SourceId = "mangafire"): CardManga {
  return {
    id: r.id || r.title?.toLowerCase().replace(/\s+/g, "-") || "",
    title: r.title || "Sem título",
    coverUrl: r.poster || null,
    source,
    type: r.type || null,
    status: null,
  }
}

export function fromMangaStop(r: MangaStopSearchResult, source: SourceId = "mangastop"): CardManga {
  return {
    id: r.id,
    title: r.title || "Sem título",
    coverUrl: r.coverUrl || null,
    source,
    type: null,
    status: null,
  }
}

export function fromNexus(m: NexusManga, source: SourceId = "nexustoons"): CardManga {
  return {
    id: m.slug || String(m.id),
    title: m.title || "Sem título",
    coverUrl: m.coverImage || null,
    source,
    type: m.type || null,
    status: m.status || null,
    rating: m.rating > 0 ? m.rating : null,
  }
}

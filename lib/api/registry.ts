import type { SourceId } from "@/lib/sources"

export type SourceType = "api" | "scraper"
export type SourceScope = "primary" | "fallback" | "complementary"
export type SourceStatus = "active" | "down" | "unknown"

export interface SourceMeta {
  id: SourceId
  label: string
  type: SourceType
  scope: SourceScope
  /** Cor no formato Tailwind (para SourceBadge/frontend) */
  color: string
  /** URL base do site/página de busca (para links externos) */
  baseUrl: string
  /** Se a fonte tem busca pública */
  searchable: boolean
  /** Se a fonte tem leitor (páginas de capítulo) */
  readable: boolean
  /** Status do cache (qual prefixo usa) */
  cachePrefix: string
  /** Status atual da fonte */
  status: SourceStatus
  /** Descrição curta para UI */
  description: string
}

/**
 * Registry central de fontes de dados.
 * Padrão inspirado em comick-source-api / Mihon source-api:
 * adicionar uma fonte = adicionar uma entrada aqui + adapter em sources.ts.
 */
export const SOURCES: Record<SourceId, SourceMeta> = {
  mangadex: {
    id: "mangadex",
    label: "MangaDex",
    type: "api",
    scope: "primary",
    color: "cyan",
    baseUrl: "https://mangadex.org",
    searchable: true,
    readable: true,
    cachePrefix: "md",
    status: "active",
    description: "API oficial, maior acervo PT-BR (~12.7k títulos)",
  },
  mangafire: {
    id: "mangafire",
    label: "MangaFire",
    type: "scraper",
    scope: "fallback",
    color: "orange",
    baseUrl: "https://mangafire.to",
    searchable: true,
    readable: true,
    cachePrefix: "mf",
    status: "active",
    description: "Aggregator gringo com seletor de idioma por capítulo",
  },
  mangastop: {
    id: "mangastop",
    label: "MangaStop",
    type: "scraper",
    scope: "fallback",
    color: "emerald",
    baseUrl: "https://mangastop.net",
    searchable: true,
    readable: true,
    cachePrefix: "ms",
    status: "active",
    description: "Fonte BR primária (WordPress + mangareader, 2456 mangás)",
  },
  leiturmanga: {
    id: "leiturmanga",
    label: "LeituraManga",
    type: "scraper",
    scope: "complementary",
    color: "pink",
    baseUrl: "https://leituramanga.net",
    searchable: false,
    readable: true,
    cachePrefix: "llm",
    status: "active",
    description: "Fonte BR secundária (Next.js SSR, catálogo via sitemap)",
  },
  queroler: {
    id: "queroler",
    label: "QueroLer",
    type: "scraper",
    scope: "complementary",
    color: "violet",
    baseUrl: "https://queroler.com",
    searchable: true,
    readable: false,
    cachePrefix: "ql",
    status: "down",
    description: "Fonte BR complementar (search-only, PDF, rate-limited) — DOWN desde 2026-09-04",
  },
  nexustoons: {
    id: "nexustoons",
    label: "Nexus",
    type: "api",
    scope: "fallback",
    color: "yellow",
    baseUrl: "https://nexustoons.com",
    searchable: true,
    readable: true,
    cachePrefix: "nx",
    status: "active",
    description: "Agregador PT-BR massivo (13.5k+ títulos, API criptografada OrionCrypto)",
  },
}

export const SOURCE_LIST: SourceMeta[] = Object.values(SOURCES)

export function getSourceMeta(source: SourceId): SourceMeta {
  return SOURCES[source]
}

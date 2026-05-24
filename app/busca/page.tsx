import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import SearchBar from "@/components/SearchBar"
import SearchFilters from "@/components/SearchFilters"
import MangaCard from "@/components/MangaCard"
import Pagination from "@/components/Pagination"
import ErrorMessage from "@/components/ErrorMessage"
import EmptyState from "@/components/EmptyState"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { searchMangaWithFilters } from "@/lib/api/mangadex"
import * as mangafire from "@/lib/api/mangafire"
import { getTagsCached } from "@/lib/cache"
import type { SearchFilters as SearchFiltersType, FilterOrder } from "@/types/mangadex"

const LIMIT = 30

type SourceId = "mangadex" | "mangafire"

function parseFilters(
  params: Awaited<SearchParamsType>,
): SearchFiltersType & { page: number; source: SourceId } {
  const status = params.status
    ? (Array.isArray(params.status) ? params.status : params.status.split(",")).filter(Boolean)
    : undefined
  const includedTags = params.includedTags
    ? params.includedTags.split(",").filter(Boolean)
    : undefined
  const excludedTags = params.excludedTags
    ? params.excludedTags.split(",").filter(Boolean)
    : undefined

  return {
    q: params.q || undefined,
    status: status && status.length > 0 ? status : undefined,
    order: (params.order as FilterOrder) || undefined,
    year: params.year ? Number(params.year) || undefined : undefined,
    includedTags: includedTags && includedTags.length > 0 ? includedTags : undefined,
    excludedTags: excludedTags && excludedTags.length > 0 ? excludedTags : undefined,
    page: Math.max(1, Number(params.page) || 1),
    source: (params.source as SourceId) === "mangafire" ? "mangafire" : "mangadex",
  }
}

type SearchParamsType = Promise<{
  q?: string
  page?: string
  source?: string
  status?: string
  order?: string
  year?: string
  includedTags?: string
  excludedTags?: string
}>

async function SearchResults({ filters }: { filters: ReturnType<typeof parseFilters> }) {
  const source = filters.source || "mangadex"

  if (source === "mangafire") {
    return <MangaFireResults query={filters.q || ""} page={filters.page} />
  }

  let result
  try {
    result = await searchMangaWithFilters({ ...filters, limit: LIMIT })
  } catch {
    return <ErrorMessage message="Erro ao buscar. Tente novamente." />
  }

  const { data: mangas, total } = result
  const hasQuery = !!filters.q
  const hasFilters = !!filters.status || !!filters.order || !!filters.year
    || !!filters.includedTags || !!filters.excludedTags

  if (mangas.length === 0) {
    const message = hasQuery
      ? `Nenhum resultado para "${filters.q}"`
      : hasFilters
        ? "Nenhum resultado com esses filtros"
        : "Nenhum mangá encontrado"
    const description = hasQuery
      ? "Tente usar termos diferentes ou ajuste os filtros."
      : hasFilters
        ? "Tente remover alguns filtros para ver mais resultados."
        : undefined
    return <EmptyState title={message} description={description} />
  }

  function buildBasePath() {
    const p = new URLSearchParams()
    if (filters.q) p.set("q", filters.q)
    if (filters.status && filters.status.length > 0) p.set("status", filters.status.join(","))
    if (filters.order && filters.order !== "relevance") p.set("order", filters.order)
    if (filters.year) p.set("year", String(filters.year))
    if (filters.includedTags && filters.includedTags.length > 0) p.set("includedTags", filters.includedTags.join(","))
    if (filters.excludedTags && filters.excludedTags.length > 0) p.set("excludedTags", filters.excludedTags.join(","))
    const qs = p.toString()
    return qs ? `/busca?${qs}` : "/busca"
  }

  return (
    <div className="space-y-4">
      {mangas.length > 0 && (
        <p className="text-sm text-muted">
          {total} resultado{total !== 1 ? "s" : ""}
          {filters.q ? ` para "${filters.q}"` : ""}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mangas.map(manga => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
      <Pagination
        currentPage={filters.page}
        total={total}
        limit={LIMIT}
        basePath={buildBasePath()}
      />
    </div>
  )
}

async function MangaFireResults({ query, page }: { query: string; page: number }) {
  if (!query) {
    return <EmptyState title="Digite um termo para buscar no MangaFire" />
  }

  let result
  try {
    result = await mangafire.searchManga(query, page)
  } catch {
    return <ErrorMessage message="Erro ao buscar no MangaFire. Tente novamente." />
  }

  if (result.results.length === 0) {
    return <EmptyState title={`Nenhum resultado para "${query}" no MangaFire`} />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {result.results.length} resultado{result.results.length !== 1 ? "s" : ""}
        {query ? ` para "${query}"` : ""}
        {" "}— Fonte: <span className="text-accent font-medium">MangaFire</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {result.results.map(r => (
          <Link
            key={r.id}
            href={`/manga/${r.id}?source=mangafire`}
            className="group flex flex-col gap-2 rounded-xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-card">
              {r.poster ? (
                <Image
                  src={r.poster}
                  alt={r.title || ""}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted text-xs">
                  Sem capa
                </div>
              )}
            </div>
            <div className="px-2 pb-2">
              <h3 className="text-xs font-medium line-clamp-2 leading-relaxed">
                {r.title}
              </h3>
              {r.type && (
                <span className="text-[10px] text-muted mt-0.5 block">{r.type}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      {result.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {page > 1 && (
            <Link
              href={`/busca?q=${encodeURIComponent(query)}&source=mangafire&page=${page - 1}`}
              className="px-3 py-1.5 rounded bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              ← Anterior
            </Link>
          )}
          {page < result.totalPages && (
            <Link
              href={`/busca?q=${encodeURIComponent(query)}&source=mangafire&page=${page + 1}`}
              className="px-3 py-1.5 rounded bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

async function FiltersSection() {
  const tags = await getTagsCached()
  return <SearchFilters tags={tags} />
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: SearchParamsType
}) {
  const params = await searchParams
  const filters = parseFilters(params)
  const source = params.source === "mangafire" ? "mangafire" : "mangadex"

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buscar Mangás</h1>

      <SearchBar initialQuery={params.q || ""} source={source} />

      <div className="flex gap-1.5 items-center">
        <span className="text-xs text-muted">Fonte:</span>
        <SourceToggle current={source} query={params.q} />
      </div>

      {source === "mangadex" && (
        <Suspense fallback={null}>
          <FiltersSection />
        </Suspense>
      )}

      <Suspense
        fallback={<MangaGridSkeleton />}
        key={JSON.stringify(filters)}
      >
        <SearchResults filters={filters} />
      </Suspense>
    </div>
  )
}

function SourceToggle({ current, query }: { current: string; query?: string }) {
  const baseUrl = query ? `/busca?q=${encodeURIComponent(query)}` : "/busca"
  return (
    <div className="flex gap-1">
      <Link
        href={baseUrl}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          current === "mangadex"
            ? "bg-accent text-white"
            : "bg-card border border-border text-muted hover:text-foreground"
        }`}
      >
        MangaDex
      </Link>
      <Link
        href={`${baseUrl}&source=mangafire`}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
          current === "mangafire"
            ? "bg-accent text-white"
            : "bg-card border border-border text-muted hover:text-foreground"
        }`}
      >
        MangaFire
      </Link>
    </div>
  )
}

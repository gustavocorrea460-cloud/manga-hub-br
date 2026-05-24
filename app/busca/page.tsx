import { Suspense } from "react"
import SearchBar from "@/components/SearchBar"
import SearchFilters from "@/components/SearchFilters"
import MangaCard from "@/components/MangaCard"
import Pagination from "@/components/Pagination"
import ErrorMessage from "@/components/ErrorMessage"
import EmptyState from "@/components/EmptyState"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { searchMangaWithFilters } from "@/lib/api/mangadex"
import { getTagsCached } from "@/lib/cache"
import type { SearchFilters as SearchFiltersType, FilterOrder } from "@/types/mangadex"

const LIMIT = 30

function parseFilters(
  params: Awaited<SearchParamsType>,
): SearchFiltersType & { page: number } {
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
  }
}

type SearchParamsType = Promise<{
  q?: string
  page?: string
  status?: string
  order?: string
  year?: string
  includedTags?: string
  excludedTags?: string
}>

async function SearchResults({ filters }: { filters: ReturnType<typeof parseFilters> }) {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buscar Mangás</h1>

      <SearchBar initialQuery={params.q || ""} />

      <Suspense fallback={null}>
        <FiltersSection />
      </Suspense>

      <Suspense
        fallback={<MangaGridSkeleton />}
        key={JSON.stringify(filters)}
      >
        <SearchResults filters={filters} />
      </Suspense>
    </div>
  )
}

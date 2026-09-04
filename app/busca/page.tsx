import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import SearchBar from "@/components/SearchBar"
import SearchFilters from "@/components/SearchFilters"
import MangaCard from "@/components/MangaCard"
import Pagination from "@/components/Pagination"
import ErrorMessage from "@/components/ErrorMessage"
import EmptyState from "@/components/EmptyState"
import SourceToggle from "@/components/SourceToggle"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { searchMangaWithFilters } from "@/lib/api/mangadex"
import {
  getTagsCached,
  searchMangaFireCached,
  searchMangaStopCached,
  searchNexusCached,
} from "@/lib/cache"
import SourceBadge from "@/components/SourceBadge"
import type { SearchFilters as SearchFiltersType, FilterOrder } from "@/types/mangadex"
import type { NexusManga } from "@/types/nexustoons"
import {
  fromMangaDex,
  fromMangaFire,
  fromMangaStop,
  fromNexus,
} from "@/lib/adapters"
import type { SourceId } from "@/components/SourceBadge"

const LIMIT = 30

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

  const validSources: SourceId[] = ["mangadex", "mangafire", "mangastop", "leiturmanga", "nexustoons"]
  const source = (params.source as SourceId) || "mangadex"

  return {
    q: params.q || undefined,
    status: status && status.length > 0 ? status : undefined,
    order: (params.order as FilterOrder) || undefined,
    year: params.year ? Number(params.year) || undefined : undefined,
    includedTags: includedTags && includedTags.length > 0 ? includedTags : undefined,
    excludedTags: excludedTags && excludedTags.length > 0 ? excludedTags : undefined,
    page: Math.max(1, Number(params.page) || 1),
    source: validSources.includes(source) ? source : "mangadex",
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
  const query = filters.q || ""

  try {
    if (source === "mangafire") {
      const res = await searchMangaFireCached(query, filters.page)
      const mangas = res.results.map((r, i) => fromMangaFire(r))
      if (mangas.length === 0) return <EmptyState title={`Nenhum resultado para "${query}" no MangaFire`} />
      const pages = res.totalPages || 1
      return (
        <Grid
          mangas={mangas}
          source="mangafire"
          total={res.results.length}
          query={query}
          page={filters.page}
          pages={pages}
          pageLimit={LIMIT}
        />
      )
    }

    if (source === "mangastop") {
      const res = await searchMangaStopCached(query)
      const mangas = res.map((r) => fromMangaStop(r))
      if (mangas.length === 0) return <EmptyState title={`Nenhum resultado para "${query}" no MangaStop`} />
      return (
        <Grid
          mangas={mangas}
          source="mangastop"
          total={mangas.length}
          query={query}
          page={filters.page}
          pages={1}
          pageLimit={LIMIT}
        />
      )
    }

    if (source === "leiturmanga") {
      // LeituraManga não tem busca (source de navegação via catálogo)
      return (
        <EmptyState
          title={`LeituraManga não tem busca`}
          description="Esta fonte funciona pelo catálogo. Use a aba Catálogo ou outra fonte."
        />
      )
    }

    if (source === "nexustoons") {
      const res = await searchNexusCached(query, filters.page)
      const mangas = res.data.map((m: NexusManga) => fromNexus(m))
      if (mangas.length === 0) return <EmptyState title={`Nenhum resultado para "${query}" no Nexus`} />
      const pages = Math.ceil(res.total / 24) || 1
      return (
        <Grid
          mangas={mangas}
          source="nexustoons"
          total={res.total}
          query={query}
          page={filters.page}
          pages={pages}
          pageLimit={24}
        />
      )
    }

    // MangaDex (default — com filtros)
    const { data: mangas, total } = await searchMangaWithFilters({ ...filters, limit: LIMIT })
    if (mangas.length === 0) {
      const hasQuery = !!filters.q
      const hasFilters = !!filters.status || !!filters.order || !!filters.year
        || !!filters.includedTags || !!filters.excludedTags
      return (
        <EmptyState
          title={hasQuery ? `Nenhum resultado para "${filters.q}"` : hasFilters ? "Nenhum resultado com esses filtros" : "Nenhum mangá encontrado"}
          description={hasQuery ? "Tente usar termos diferentes ou ajuste os filtros." : hasFilters ? "Tente remover alguns filtros para ver mais resultados." : undefined}
        />
      )
    }
    return (
      <Grid
        mangas={mangas.map((m) => fromMangaDex(m))}
        source="mangadex"
        total={total}
        query={query}
        page={filters.page}
        pages={Math.ceil(total / LIMIT) || 1}
        pageLimit={LIMIT}
      />
    )
  } catch {
    return <ErrorMessage message="Erro ao buscar. Tente novamente." />
  }
}

function Grid({
  mangas,
  source,
  total,
  query,
  page,
  pages,
  pageLimit,
}: {
  mangas: ReturnType<typeof fromMangaDex>[]
  source: SourceId
  total: number
  query: string
  page: number
  pages: number
  pageLimit: number
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {total} resultado{total !== 1 ? "s" : ""}
        {query ? ` para "${query}"` : ""}
        {" "}— Fonte: <span className="text-accent font-medium"><SourceBadge source={source} size="xs" /></span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mangas.map((m, i) => (
          <MangaCard key={`${source}-${m.id}`} manga={m} index={i} />
        ))}
      </div>
      {pages > 1 && (
        <Pagination
          currentPage={page}
          total={total}
          limit={pageLimit}
          basePath={query ? `/busca?q=${encodeURIComponent(query)}&source=${source}` : `/busca?source=${source}`}
        />
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
  const source = filters.source

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buscar Mangás</h1>
        <p className="text-muted text-sm mt-1">Encontre seu próximo mangá em todas as fontes</p>
      </div>

      <SearchBar initialQuery={params.q || ""} source={source} />

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-muted-foreground">Fonte:</span>
        <SourceToggle current={source} query={params.q} />
      </div>

      {source === "mangadex" && (
        <Suspense fallback={null}>
          <FiltersSection />
        </Suspense>
      )}

      <Suspense fallback={<MangaGridSkeleton />} key={JSON.stringify(filters)}>
        <SearchResults filters={filters} />
      </Suspense>
    </div>
  )
}

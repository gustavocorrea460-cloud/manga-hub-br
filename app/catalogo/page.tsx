import { Suspense } from "react"
import MangaCard from "@/components/MangaCard"
import SourceToggle from "@/components/SourceToggle"
import EmptyState from "@/components/EmptyState"
import ErrorMessage from "@/components/ErrorMessage"
import Pagination from "@/components/Pagination"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { getCatalogEntries } from "@/lib/db"
import type { SourceId } from "@/components/SourceBadge"

const LIMIT = 30

const CATALOG_SOURCES: SourceId[] = ["mangastop", "leiturmanga"]

async function CatalogGrid({ source, page }: { source: SourceId; page: number }) {
  if (!CATALOG_SOURCES.includes(source)) {
    return (
      <EmptyState
        title="Catálogo indisponível"
        description="Esta fonte não possui catálogo offline. Use a busca para encontrar mangás."
      />
    )
  }

  let result
  try {
    result = await getCatalogEntries(source, page, LIMIT)
  } catch {
    return <ErrorMessage message="Erro ao carregar o catálogo." />
  }

  const { entries, total } = result

  if (entries.length === 0) {
    return <EmptyState title="Nenhum mangá encontrado no catálogo" />
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {total} mangá{total !== 1 ? "s" : ""} no catálogo
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {entries.map((entry, i) => {
          const meta = entry.metadata as Record<string, unknown>
          return (
            <MangaCard
              key={entry.id}
              index={i}
              manga={{
                id: entry.slug,
                title: entry.title,
                coverUrl: (meta?.coverUrl as string) || null,
                source,
                status: (meta?.status as string) || null,
              }}
            />
          )
        })}
      </div>
      <Pagination
        currentPage={page}
        total={total}
        limit={LIMIT}
        basePath={`/catalogo?source=${source}`}
      />
    </div>
  )
}

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; page?: string }>
}) {
  const params = await searchParams
  const source = (params.source as SourceId) || "mangastop"
  const page = Math.max(1, Number(params.page) || 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="text-muted text-sm mt-1">Todos os mangás importados das fontes</p>
        </div>
        <SourceToggle current={source} sources={CATALOG_SOURCES} />
      </div>

      <Suspense fallback={<MangaGridSkeleton />} key={`${source}:${page}`}>
        <CatalogGrid source={source} page={page} />
      </Suspense>
    </div>
  )
}

import { Suspense } from "react"
import SearchBar from "@/components/SearchBar"
import MangaCard from "@/components/MangaCard"
import Pagination from "@/components/Pagination"
import ErrorMessage from "@/components/ErrorMessage"
import EmptyState from "@/components/EmptyState"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { searchManga } from "@/lib/api/mangadex"

const LIMIT = 30

async function SearchResults({
  query,
  page,
}: {
  query: string
  page: number
}) {
  if (!query.trim()) {
    return <EmptyState title="Digite algo para buscar" />
  }

  let result
  try {
    result = await searchManga(query, page, LIMIT)
  } catch {
    return <ErrorMessage message="Erro ao buscar. Tente novamente." />
  }

  const { data: mangas, total } = result

  if (mangas.length === 0) {
    return (
      <EmptyState
        title={`Nenhum resultado para "${query}"`}
        description="Tente usar termos diferentes ou verifique a ortografia."
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {total} resultado{total !== 1 ? "s" : ""} para &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mangas.map(manga => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        total={total}
        limit={LIMIT}
        basePath={`/busca?q=${encodeURIComponent(query)}`}
      />
    </div>
  )
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q = "", page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buscar Mangás</h1>

      <SearchBar initialQuery={q} />

      <Suspense fallback={<MangaGridSkeleton />} key={`${q}-${page}`}>
        <SearchResults query={q} page={page} />
      </Suspense>
    </div>
  )
}

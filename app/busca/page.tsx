import { Suspense } from "react"
import SearchBar from "@/components/SearchBar"
import MangaCard from "@/components/MangaCard"
import ErrorMessage from "@/components/ErrorMessage"
import EmptyState from "@/components/EmptyState"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { searchManga } from "@/lib/api/mangadex"

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return <EmptyState title="Digite algo para buscar" />
  }

  let mangas
  try {
    mangas = await searchManga(query)
  } catch {
    return <ErrorMessage message="Erro ao buscar. Tente novamente." />
  }

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
        {mangas.length} resultado{mangas.length !== 1 ? "s" : ""} para &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mangas.map(manga => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
    </div>
  )
}

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Buscar Mangás</h1>

      <SearchBar initialQuery={q} />

      <Suspense fallback={<MangaGridSkeleton />}>
        <SearchResults query={q} />
      </Suspense>
    </div>
  )
}

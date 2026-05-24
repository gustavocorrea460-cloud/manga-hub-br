import MangaCard from "@/components/MangaCard"
import ErrorMessage from "@/components/ErrorMessage"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { getLatestMangasCached } from "@/lib/cache"
import { Suspense } from "react"

async function LatestGrid() {
  let mangas
  try {
    mangas = await getLatestMangasCached(1)
  } catch {
    return <ErrorMessage message="Não foi possível carregar os lançamentos. Tente novamente mais tarde." />
  }

  if (mangas.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        Nenhum mangá encontrado.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {mangas.map(manga => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lançamentos Recentes</h1>
        <p className="text-muted text-sm mt-1">
          Últimos mangás atualizados em português
        </p>
      </div>

      <Suspense fallback={<MangaGridSkeleton />}>
        <LatestGrid />
      </Suspense>
    </div>
  )
}

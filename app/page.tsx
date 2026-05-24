import MangaCard from "@/components/MangaCard"
import Pagination from "@/components/Pagination"
import ErrorMessage from "@/components/ErrorMessage"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { getLatestMangasCached } from "@/lib/cache"
import { Suspense } from "react"

const LIMIT = 30

async function LatestGrid({ page }: { page: number }) {
  let result
  try {
    result = await getLatestMangasCached(page)
  } catch {
    return <ErrorMessage message="Não foi possível carregar os lançamentos. Tente novamente mais tarde." />
  }

  const { data: mangas, total } = result

  if (mangas.length === 0) {
    return (
      <div className="text-center py-16 text-muted">
        Nenhum mangá encontrado.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {mangas.map(manga => (
          <MangaCard key={manga.id} manga={manga} />
        ))}
      </div>
      <Pagination
        currentPage={page}
        total={total}
        limit={LIMIT}
        basePath="/"
      />
    </>
  )
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageStr } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lançamentos Recentes</h1>
        <p className="text-muted text-sm mt-1">
          Últimos mangás atualizados em português
        </p>
      </div>

      <Suspense fallback={<MangaGridSkeleton />} key={page}>
        <LatestGrid page={page} />
      </Suspense>
    </div>
  )
}

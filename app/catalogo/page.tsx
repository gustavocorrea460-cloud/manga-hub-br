import Link from "next/link"
import Image from "next/image"
import { Suspense } from "react"
import SourceBadge from "@/components/SourceBadge"
import EmptyState from "@/components/EmptyState"
import ErrorMessage from "@/components/ErrorMessage"
import Pagination from "@/components/Pagination"
import { MangaGridSkeleton } from "@/components/LoadingSkeleton"
import { getCatalogEntries } from "@/lib/db"

const LIMIT = 30
type SourceId = "mangadex" | "mangafire" | "mangastop" | "leiturmanga"

async function CatalogGrid({
  source,
  page,
  query,
}: {
  source: SourceId
  page: number
  query?: string
}) {
  if (source === "mangadex" || source === "mangafire") {
    return (
      <EmptyState
        title="Catálogo indisponível"
        description="Esta fonte não possui catálogo offline. Use a busca para encontrar mangás."
      />
    )
  }

  if (source === "leiturmanga") {
    return (
      <EmptyState
        title="Catálogo LeituraManga em breve"
        description="O dump do catálogo LeituraManga ainda não foi realizado."
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
        {entries.map(entry => {
          const meta = entry.metadata as Record<string, unknown>
          const coverUrl = (meta?.coverUrl as string) || null
          return (
            <Link
              key={entry.id}
              href={`/manga/${entry.slug}?source=mangastop`}
              className="group flex flex-col gap-2 rounded-xl overflow-hidden bg-card border border-border hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/5"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-card">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={entry.title}
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
                <div className="absolute top-1.5 left-1.5">
                  <SourceBadge source={source} size="xs" />
                </div>
              </div>
              <div className="px-2 pb-2">
                <h3 className="text-xs font-medium line-clamp-2 leading-relaxed">
                  {entry.title}
                </h3>
                {typeof meta?.status === "string" && (
                  <span className="text-[10px] text-muted mt-0.5 block">
                    {meta.status as string}
                  </span>
                )}
              </div>
            </Link>
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
  searchParams: Promise<{ source?: string; page?: string; q?: string }>
}) {
  const params = await searchParams
  const source = (params.source as SourceId) || "mangastop"
  const page = Math.max(1, Number(params.page) || 1)
  const query = params.q

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <div className="flex gap-1">
          <SourceToggle current={source} />
        </div>
      </div>

      <Suspense fallback={<MangaGridSkeleton />} key={`${source}:${page}:${query}`}>
        <CatalogGrid source={source} page={page} query={query} />
      </Suspense>
    </div>
  )
}

function SourceToggle({ current }: { current: SourceId }) {
  const sources: { id: SourceId; label: string }[] = [
    { id: "mangastop", label: "MangaStop" },
    { id: "leiturmanga", label: "LeituraManga" },
    { id: "mangadex", label: "MangaDex" },
    { id: "mangafire", label: "MangaFire" },
  ]

  return (
    <div className="flex gap-1">
      {sources.map(s => (
        <Link
          key={s.id}
          href={`/catalogo?source=${s.id}`}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            current === s.id
              ? "bg-accent text-white"
              : "bg-card border border-border text-muted hover:text-foreground"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  )
}

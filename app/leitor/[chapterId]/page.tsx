import { notFound } from "next/navigation"
import { Suspense } from "react"
import Reader from "@/components/Reader"
import ErrorMessage from "@/components/ErrorMessage"
import SourceBadge from "@/components/SourceBadge"
import {
  getChapterPagesCached,
  getChaptersCached,
  getMangaFirePagesCached,
  getMangaFireChaptersCached,
  getMangaStopPagesCached,
  getMangaStopChaptersCached,
  getLeituraMangaPagesCached,
  getLeituraMangaChaptersCached,
  getNexusPagesCached,
  getNexusChaptersCached,
} from "@/lib/cache"
import type { SourceId } from "@/components/SourceBadge"

function sortByNumberDesc<T extends { number: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const an = parseFloat(a.number || "0")
    const bn = parseFloat(b.number || "0")
    return bn - an
  })
}

interface ChapterLike {
  id: string
  number: string
}

/** Prev/next por número — genérico para qualquer fonte com {number, id-like} */
function getPrevNext<T extends { number: string }>(
  chapters: T[],
  currentNumber: string,
  idOf: (c: T) => string,
): { prevId: string | null; nextId: string | null } {
  const sorted = sortByNumberDesc(chapters)
  const idx = sorted.findIndex(c => c.number === currentNumber)
  if (idx === -1) return { prevId: null, nextId: null }
  return {
    prevId: idx < sorted.length - 1 ? idOf(sorted[idx + 1]) : null,
    nextId: idx > 0 ? idOf(sorted[idx - 1]) : null,
  }
}

interface ReaderData {
  pages: string[]
  prevId: string | null
  nextId: string | null
}

async function fetchPages(source: SourceId, chapterId: string, mangaId?: string): Promise<ReaderData> {
  switch (source) {
    case "mangafire": {
      const images = await getMangaFirePagesCached(chapterId)
      let prevId: string | null = null
      let nextId: string | null = null
      if (mangaId) {
        const chapters = await getMangaFireChaptersCached(mangaId, "en")
        const r = getPrevNext(chapters, chapterId, c => c.chapterId)
        prevId = r.prevId
        nextId = r.nextId
      }
      return { pages: images, prevId, nextId }
    }
    case "mangastop": {
      const images = await getMangaStopPagesCached(chapterId)
      let prevId: string | null = null
      let nextId: string | null = null
      if (mangaId) {
        const chapters = await getMangaStopChaptersCached(mangaId)
        const r = getPrevNext(chapters, String(chapterId), c => c.chapterId)
        prevId = r.prevId
        nextId = r.nextId
      }
      return { pages: images, prevId, nextId }
    }
    case "leiturmanga": {
      const images = await getLeituraMangaPagesCached(chapterId)
      let prevId: string | null = null
      let nextId: string | null = null
      if (mangaId) {
        const chapters = await getLeituraMangaChaptersCached(mangaId)
        const currentNum = chapterId.split(":")[1]
        const r = getPrevNext(chapters, currentNum, c => `${mangaId}:${c.number}`)
        prevId = r.prevId
        nextId = r.nextId
      }
      return { pages: images, prevId, nextId }
    }
    case "nexustoons": {
      const pages = await getNexusPagesCached(chapterId)
      let prevId: string | null = null
      let nextId: string | null = null
      if (mangaId) {
        const chapters = await getNexusChaptersCached(mangaId)
        const r = getPrevNext(chapters, chapterId, c => String(c.id))
        prevId = r.prevId
        nextId = r.nextId
      }
      return { pages: pages.map(p => p.imageUrl), prevId, nextId }
    }
    case "queroler":
      return { pages: [], prevId: null, nextId: null }
    case "mangadex":
    default: {
      const pagesData = await getChapterPagesCached(chapterId)
      let prevId: string | null = null
      let nextId: string | null = null
      if (mangaId) {
        const chapters = await getChaptersCached(mangaId)
        const sorted = [...chapters].sort((a, b) => {
          const an = parseFloat(a.attributes.chapter || "0")
          const bn = parseFloat(b.attributes.chapter || "0")
          return bn - an
        })
        const idx = sorted.findIndex(c => c.id === chapterId)
        if (idx !== -1) {
          prevId = idx < sorted.length - 1 ? sorted[idx + 1].id : null
          nextId = idx > 0 ? sorted[idx - 1].id : null
        }
      }
      return { pages: pagesData.dataSaver, prevId, nextId }
    }
  }
}

async function ReaderContent({
  chapterId,
  mangaId,
  source,
}: {
  chapterId: string
  mangaId?: string
  source: SourceId
}) {
  if (source === "queroler") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </div>
        <p className="text-muted text-center max-w-md">
          O QueroLer disponibiliza mangás apenas em formato <strong>PDF</strong> para download.
        </p>
        <p className="text-sm text-muted text-center max-w-md">
          Para ler online, utilize outro agregador compatível com este mangá.
        </p>
      </div>
    )
  }

  let data: ReaderData
  try {
    data = await fetchPages(source, chapterId, mangaId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar as páginas deste capítulo." />
  }

  if (data.pages.length === 0) {
    return <ErrorMessage message="Este capítulo não possui páginas disponíveis." />
  }

  return (
    <Reader
      pages={data.pages}
      baseUrl=""
      hash=""
      chapterId={chapterId}
      mangaId={mangaId || ""}
      useDataSaver={source === "mangadex"}
      prevChapterId={data.prevId}
      nextChapterId={data.nextId}
      absoluteUrls={source !== "mangadex"}
    />
  )
}

export default async function LeitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>
  searchParams: Promise<{ source?: string; mangaId?: string }>
}) {
  const [{ chapterId }, sp] = await Promise.all([params, searchParams])
  if (!chapterId) notFound()

  const valid: SourceId[] = ["mangadex", "mangafire", "mangastop", "leiturmanga", "nexustoons", "queroler"]
  const source = (sp.source as SourceId) || "mangadex"
  const finalSource: SourceId = valid.includes(source) ? source : "mangadex"

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-2">
        <h1 className="text-lg font-bold">Leitor</h1>
        <SourceBadge source={finalSource} size="xs" />
      </header>
      <Suspense
        fallback={
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ReaderContent chapterId={chapterId} mangaId={sp.mangaId} source={finalSource} />
      </Suspense>
    </div>
  )
}

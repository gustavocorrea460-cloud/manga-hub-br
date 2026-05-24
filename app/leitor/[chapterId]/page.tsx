import { notFound } from "next/navigation"
import Reader from "@/components/Reader"
import ErrorMessage from "@/components/ErrorMessage"
import {
  getChapterPagesCached,
  getChaptersCached,
  getMangaFirePagesCached,
  getMangaFireChaptersCached,
  getMangaStopPagesCached,
  getMangaStopChaptersCached,
} from "@/lib/cache"
import { getScanlatorName } from "@/types/mangadex"
import { Suspense } from "react"
import type { Chapter } from "@/types/mangadex"
import type { MangaFireChapter } from "@/types/mangafire"
import type { MangaStopChapter } from "@/types/mangastop"

type SourceId = "mangadex" | "mangafire" | "mangastop"

async function getPrevNextMangaDex(
  chapters: Chapter[],
  currentId: string,
): Promise<{ prevId: string | null; nextId: string | null }> {
  const sorted = [...chapters].sort((a, b) => {
    const an = parseFloat(a.attributes.chapter || "0")
    const bn = parseFloat(b.attributes.chapter || "0")
    return bn - an
  })
  const idx = sorted.findIndex(c => c.id === currentId)
  return {
    prevId: idx < sorted.length - 1 ? sorted[idx + 1].id : null,
    nextId: idx > 0 ? sorted[idx - 1].id : null,
  }
}

async function getPrevNextMangaFire(
  chapters: MangaFireChapter[],
  currentId: string,
): Promise<{ prevId: string | null; nextId: string | null }> {
  const sorted = [...chapters].sort((a, b) => {
    const an = parseFloat(a.number || "0")
    const bn = parseFloat(b.number || "0")
    return bn - an
  })
  const idx = sorted.findIndex(c => c.chapterId === currentId)
  return {
    prevId: idx < sorted.length - 1 ? sorted[idx + 1].chapterId : null,
    nextId: idx > 0 ? sorted[idx - 1].chapterId : null,
  }
}

async function getPrevNextMangaStop(
  chapters: MangaStopChapter[],
  currentId: string,
): Promise<{ prevId: string | null; nextId: string | null }> {
  const sorted = [...chapters].sort((a, b) => {
    const an = parseFloat(a.number || "0")
    const bn = parseFloat(b.number || "0")
    return bn - an
  })
  const idx = sorted.findIndex(c => c.chapterId === currentId)
  return {
    prevId: idx < sorted.length - 1 ? sorted[idx + 1].chapterId : null,
    nextId: idx > 0 ? sorted[idx - 1].chapterId : null,
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
  if (source === "mangafire") {
    return <MangaFireReader chapterId={chapterId} mangaId={mangaId} />
  }

  if (source === "mangastop") {
    return <MangaStopReader chapterId={chapterId} mangaId={mangaId} />
  }

  let pagesData
  try {
    pagesData = await getChapterPagesCached(chapterId)
  } catch {
    return (
      <ErrorMessage message="Não foi possível carregar as páginas deste capítulo." />
    )
  }

  const { hash, baseUrl, dataSaver } = pagesData

  let prevNext = { prevId: null as string | null, nextId: null as string | null }
  let scanlator: string | null = null

  if (mangaId) {
    try {
      const chapters = await getChaptersCached(mangaId)
      prevNext = await getPrevNextMangaDex(chapters, chapterId)
      const currentChapter = chapters.find(c => c.id === chapterId)
      if (currentChapter) {
        scanlator = getScanlatorName(currentChapter)
      }
    } catch {
      // non-critical
    }
  }

  return (
    <Reader
      pages={dataSaver}
      baseUrl={baseUrl}
      hash={hash}
      chapterId={chapterId}
      mangaId={mangaId || ""}
      useDataSaver
      prevChapterId={prevNext.prevId}
      nextChapterId={prevNext.nextId}
      scanlator={scanlator}
    />
  )
}

async function MangaStopReader({
  chapterId,
  mangaId,
}: {
  chapterId: string
  mangaId?: string
}) {
  let images: string[]
  try {
    images = await getMangaStopPagesCached(chapterId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar as páginas deste capítulo no MangaStop." />
  }

  let prevNext = { prevId: null as string | null, nextId: null as string | null }

  if (mangaId) {
    try {
      const chapters = await getMangaStopChaptersCached(mangaId)
      prevNext = await getPrevNextMangaStop(chapters, chapterId)
    } catch {
      // non-critical
    }
  }

  return (
    <Reader
      pages={images}
      baseUrl=""
      hash=""
      chapterId={chapterId}
      mangaId={mangaId || ""}
      useDataSaver={false}
      prevChapterId={prevNext.prevId}
      nextChapterId={prevNext.nextId}
      absoluteUrls
    />
  )
}

async function MangaFireReader({
  chapterId,
  mangaId,
}: {
  chapterId: string
  mangaId?: string
}) {
  let images: string[]
  try {
    images = await getMangaFirePagesCached(chapterId)
  } catch {
    return <ErrorMessage message="Não foi possível carregar as páginas deste capítulo no MangaFire." />
  }

  let prevNext = { prevId: null as string | null, nextId: null as string | null }

  if (mangaId) {
    try {
      const chapters = await getMangaFireChaptersCached(mangaId, "en")
      prevNext = await getPrevNextMangaFire(chapters, chapterId)
    } catch {
      // non-critical
    }
  }

  return (
    <Reader
      pages={images}
      baseUrl=""
      hash=""
      chapterId={chapterId}
      mangaId={mangaId || ""}
      useDataSaver={false}
      prevChapterId={prevNext.prevId}
      nextChapterId={prevNext.nextId}
      absoluteUrls
    />
  )
}

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>
  searchParams: Promise<{ mangaId?: string; source?: string }>
}) {
  const [{ chapterId }, sp] = await Promise.all([params, searchParams])
  const source = sp.source === "mangafire" ? "mangafire" : sp.source === "mangastop" ? "mangastop" : "mangadex"
  const { mangaId } = sp

  if (!chapterId) notFound()

  return (
    <div className="py-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ReaderContent chapterId={chapterId} mangaId={mangaId} source={source} />
      </Suspense>
    </div>
  )
}

import { notFound } from "next/navigation"
import Reader from "@/components/Reader"
import ErrorMessage from "@/components/ErrorMessage"
import { getChapterPagesCached, getChaptersCached } from "@/lib/cache"
import { getScanlatorName } from "@/types/mangadex"
import { Suspense } from "react"
import type { Chapter } from "@/types/mangadex"

async function getPrevNextChapter(
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

async function ReaderContent({
  chapterId,
  mangaId,
}: {
  chapterId: string
  mangaId?: string
}) {
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
      prevNext = await getPrevNextChapter(chapters, chapterId)
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

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ chapterId: string }>
  searchParams: Promise<{ mangaId?: string }>
}) {
  const { chapterId } = await params
  const { mangaId } = await searchParams

  if (!chapterId) {
    notFound()
  }

  return (
    <div className="py-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ReaderContent chapterId={chapterId} mangaId={mangaId} />
      </Suspense>
    </div>
  )
}

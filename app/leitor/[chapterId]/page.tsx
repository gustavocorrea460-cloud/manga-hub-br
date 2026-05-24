import { notFound } from "next/navigation"
import Reader from "@/components/Reader"
import ErrorMessage from "@/components/ErrorMessage"
import { getChapterPagesCached } from "@/lib/cache"
import { Suspense } from "react"

async function ReaderContent({ chapterId }: { chapterId: string }) {
  let data
  try {
    data = await getChapterPagesCached(chapterId)
  } catch {
    return (
      <ErrorMessage message="Não foi possível carregar as páginas deste capítulo." />
    )
  }

  return (
    <Reader
      pages={data.dataSaver}
      baseUrl={data.baseUrl}
      hash=""
      chapterId={chapterId}
      mangaId=""
      useDataSaver
    />
  )
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ chapterId: string }>
}) {
  const { chapterId } = await params

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
        <ReaderContent chapterId={chapterId} />
      </Suspense>
    </div>
  )
}

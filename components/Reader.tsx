"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface Props {
  pages: string[]
  baseUrl: string
  hash: string
  chapterId: string
  mangaId: string
  useDataSaver?: boolean
}

export default function Reader({
  pages,
  baseUrl,
  hash,
  mangaId,
  useDataSaver = false,
}: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const suffix = useDataSaver ? "data-saver" : "data"
  const pageUrl = `${baseUrl}/${suffix}/${hash}/${pages[currentPage]}`

  function goNext() {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1)
      setLoading(true)
    }
  }

  function goPrev() {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1)
      setLoading(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-3xl">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        <span className="text-sm text-muted">
          {currentPage + 1} / {pages.length}
        </span>

        <button
          onClick={goNext}
          disabled={currentPage >= pages.length - 1}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima →
        </button>
      </div>

      <div className="relative w-full max-w-3xl min-h-[50vh]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={pageUrl}
          alt={`Página ${currentPage + 1}`}
          width={800}
          height={1200}
          className={`w-full h-auto rounded-lg ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
          onLoad={() => setLoading(false)}
          unoptimized
          onClick={goNext}
        />
      </div>

      <div className="flex items-center justify-between w-full max-w-3xl">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        <Link
          href={`/manga/${mangaId}`}
          className="text-sm text-muted hover:text-accent transition-colors"
        >
          Voltar ao mangá
        </Link>

        <button
          onClick={goNext}
          disabled={currentPage >= pages.length - 1}
          className="px-4 py-2 rounded-lg bg-card border border-border text-sm hover:border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próxima →
        </button>
      </div>
    </div>
  )
}

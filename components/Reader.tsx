"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"

interface Props {
  pages: string[]
  baseUrl: string
  hash: string
  chapterId: string
  mangaId: string
  useDataSaver?: boolean
  prevChapterId?: string | null
  nextChapterId?: string | null
  scanlator?: string | null
}

export default function Reader({
  pages,
  baseUrl,
  hash,
  mangaId,
  useDataSaver = false,
  prevChapterId,
  nextChapterId,
  scanlator,
}: Props) {
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const suffix = useDataSaver ? "data-saver" : "data"
  const pageUrl = `${baseUrl}/${suffix}/${hash}/${pages[currentPage]}`

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(p => p + 1)
      setLoading(true)
    }
  }, [currentPage, pages.length])

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1)
      setLoading(true)
    }
  }, [currentPage])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        if (currentPage < pages.length - 1) {
          goNext()
        } else if (nextChapterId) {
          window.location.href = `/leitor/${nextChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`
        }
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        if (currentPage > 0) {
          goPrev()
        } else if (prevChapterId) {
          window.location.href = `/leitor/${prevChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, pages.length, goNext, goPrev, nextChapterId, prevChapterId, mangaId])

  function handleImageClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width * 0.3) {
      goPrev()
    } else if (x > rect.width * 0.7) {
      goNext()
    }
  }

  const isLastPage = currentPage >= pages.length - 1
  const isFirstPage = currentPage <= 0

  return (
    <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto px-2">
      {scanlator && (
        <div className="w-full text-center text-xs text-muted">
          Traduzido por: <span className="text-foreground">{scanlator}</span>
        </div>
      )}

      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2">
          {prevChapterId && isFirstPage && (
            <Link
              href={`/leitor/${prevChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              ← Cap. anterior
            </Link>
          )}
          <button
            onClick={goPrev}
            disabled={isFirstPage && !prevChapterId}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
        </div>

        <span className="text-sm text-muted tabular-nums">
          {currentPage + 1} / {pages.length}
        </span>

        <div className="flex gap-2">
          <button
            onClick={goNext}
            disabled={isLastPage && !nextChapterId}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
          {nextChapterId && isLastPage && (
            <Link
              href={`/leitor/${nextChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              Próx. capítulo →
            </Link>
          )}
        </div>
      </div>

      <div className="relative w-full min-h-[50vh]">
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
          className={`w-full h-auto rounded-lg cursor-pointer select-none ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
          onLoad={() => setLoading(false)}
          unoptimized
          onClick={handleImageClick}
          draggable={false}
        />
      </div>

      <div className="flex items-center justify-between w-full">
        <div className="flex gap-2">
          {prevChapterId && isFirstPage && (
            <Link
              href={`/leitor/${prevChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              ← Cap. anterior
            </Link>
          )}
          <button
            onClick={goPrev}
            disabled={isFirstPage && !prevChapterId}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
        </div>

        {mangaId && (
          <Link
            href={`/manga/${mangaId}`}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            Voltar ao mangá
          </Link>
        )}

        <div className="flex gap-2">
          <button
            onClick={goNext}
            disabled={isLastPage && !nextChapterId}
            className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Próxima →
          </button>
          {nextChapterId && isLastPage && (
            <Link
              href={`/leitor/${nextChapterId}${mangaId ? `?mangaId=${mangaId}` : ""}`}
              className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              Próx. capítulo →
            </Link>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted/50 text-center">
        Dica: Use ← → ou clique nas laterais da imagem para navegar. Espaço para próxima página.
      </p>
    </div>
  )
}

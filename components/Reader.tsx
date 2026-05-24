"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { leitorUrl } from "@/lib/utils"

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

type ReadingMode = "single" | "long-strip"

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
  const [mode, setMode] = useState<ReadingMode>("single")
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const suffix = useDataSaver ? "data-saver" : "data"

  function pageUrl(pageIdx: number) {
    return `${baseUrl}/${suffix}/${hash}/${pages[pageIdx]}`
  }

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
      if (mode === "single") {
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault()
          if (currentPage < pages.length - 1) {
            goNext()
          } else if (nextChapterId) {
            window.location.href = leitorUrl(nextChapterId, mangaId)
          }
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          if (currentPage > 0) {
            goPrev()
          } else if (prevChapterId) {
            window.location.href = leitorUrl(prevChapterId, mangaId)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, pages.length, goNext, goPrev, nextChapterId, prevChapterId, mangaId, mode])

  useEffect(() => {
    if (mode === "long-strip" && containerRef.current) {
      const el = containerRef.current
      function onScroll() {
        const { scrollTop, scrollHeight, clientHeight } = el
        const progress = Math.min(
          100,
          Math.round((scrollTop / (scrollHeight - clientHeight)) * 100),
        )
        setScrollProgress(isNaN(progress) ? 0 : progress)
      }
      el.addEventListener("scroll", onScroll)
      return () => el.removeEventListener("scroll", onScroll)
    }
  }, [mode])

  function handleImageClick(e: React.MouseEvent) {
    if (mode !== "single") return
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
    <div className="flex flex-col items-center gap-3 max-w-5xl mx-auto px-2">
      {scanlator && (
        <div className="w-full text-center text-xs text-muted">
          Traduzido por: <span className="text-foreground">{scanlator}</span>
        </div>
      )}

      <div className="flex items-center justify-between w-full gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(m => (m === "single" ? "long-strip" : "single"))}
            className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            {mode === "single" ? "📄 Long Strip" : "📖 Página Única"}
          </button>
          <span className="text-xs text-muted">
            {mode === "single"
              ? `${currentPage + 1} / ${pages.length}`
              : `${scrollProgress}%`}
          </span>
        </div>

        <div className="flex gap-1.5">
          {mode === "single" && prevChapterId && isFirstPage && (
            <Link
              href={leitorUrl(prevChapterId, mangaId)}
              className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors"
            >
              ← Cap. anterior
            </Link>
          )}
          {mode === "single" && (
            <button
              onClick={goPrev}
              disabled={isFirstPage && !prevChapterId}
              className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
          )}
          {mode === "single" && (
            <button
              onClick={goNext}
              disabled={isLastPage && !nextChapterId}
              className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
          )}
          {mode === "single" && nextChapterId && isLastPage && (
            <Link
              href={leitorUrl(nextChapterId, mangaId)}
              className="px-2 py-1 rounded bg-accent text-white text-[11px] font-medium hover:bg-accent-hover transition-colors"
            >
              Próx. capítulo →
            </Link>
          )}
        </div>
      </div>

      {mode === "single" ? (
        <div className="relative w-full min-h-[50vh]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <Image
            src={pageUrl(currentPage)}
            alt={`Página ${currentPage + 1}`}
            width={800}
            height={1200}
            className={`w-full h-auto rounded-lg cursor-pointer select-none ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
            onLoad={() => setLoading(false)}
            unoptimized
            onClick={handleImageClick}
            draggable={false}
          />
          {currentPage < pages.length - 1 && (
            <link rel="prefetch" href={pageUrl(currentPage + 1)} />
          )}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full max-w-3xl mx-auto overflow-y-auto space-y-2"
          style={{ maxHeight: "95vh" }}
        >
          {pages.map((_, i) => (
            <Image
              key={i}
              src={pageUrl(i)}
              alt={`Página ${i + 1}`}
              width={800}
              height={1200}
              className="w-full h-auto rounded"
              unoptimized
              loading={i < 3 ? undefined : "lazy"}
              draggable={false}
            />
          ))}
        </div>
      )}

      {mode === "single" && (
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-1.5">
            {prevChapterId && isFirstPage && (
              <Link
                href={leitorUrl(prevChapterId, mangaId)}
                className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors"
              >
                ← Cap. anterior
              </Link>
            )}
            <button
              onClick={goPrev}
              disabled={isFirstPage}
              className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
          </div>

          {mangaId && (
            <Link
              href={`/manga/${mangaId}`}
              className="text-[11px] text-muted hover:text-accent transition-colors"
            >
              Voltar ao mangá
            </Link>
          )}

          <div className="flex gap-1.5">
            <button
              onClick={goNext}
              disabled={isLastPage}
              className="px-2 py-1 rounded bg-card border border-border text-[11px] text-muted hover:text-foreground hover:border-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Próxima →
            </button>
            {nextChapterId && isLastPage && (
              <Link
                href={leitorUrl(nextChapterId, mangaId)}
                className="px-2 py-1 rounded bg-accent text-white text-[11px] font-medium hover:bg-accent-hover transition-colors"
              >
                Próx. capítulo →
              </Link>
            )}
          </div>
        </div>
      )}

      {mode === "long-strip" && nextChapterId && scrollProgress >= 95 && (
        <Link
          href={leitorUrl(nextChapterId, mangaId)}
          className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Próximo Capítulo →
        </Link>
      )}

      <p className="text-[10px] text-muted/50 text-center">
        {mode === "single"
          ? "Dica: Use ← → ou clique nas laterais da imagem. Espaço para próxima página."
          : "Role para baixo para continuar lendo."}
      </p>
    </div>
  )
}

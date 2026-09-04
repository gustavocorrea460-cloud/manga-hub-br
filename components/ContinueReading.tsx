"use client"

import Link from "next/link"
import Image from "next/image"
import { useContinueReading } from "@/lib/storage"

export default function ContinueReading() {
  const { items } = useContinueReading()
  const recent = items.slice(0, 4)

  if (recent.length === 0) return null

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Continue lendo</h2>
        <Link href="/" className="text-xs text-muted hover:text-foreground transition-colors">
          Ver todos
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recent.map(item => (
          <Link
            key={item.mangaId}
            href={`/leitor/${item.chapterId}?source=${item.source}&mangaId=${encodeURIComponent(item.mangaId)}`}
            className="group flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/60 transition-all hover:shadow-hover"
          >
            <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0 bg-border">
              {item.coverUrl ? (
                <Image
                  src={item.coverUrl}
                  alt={item.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted text-[10px]">
                  Sem capa
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                {item.title}
              </p>
              <p className="text-[11px] text-muted mt-1">Cap. {item.chapterNumber}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

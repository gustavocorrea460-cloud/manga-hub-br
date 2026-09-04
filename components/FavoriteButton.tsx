"use client"

import { useFavorites } from "@/lib/storage"
import type { DetailManga } from "./MangaDetail"

interface Props {
  manga: DetailManga
}

export default function FavoriteButton({ manga }: Props) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const fav = isFavorite(`${manga.source}:${manga.id}`)

  return (
    <button
      type="button"
      onClick={() => toggleFavorite({
        id: `${manga.source}:${manga.id}`,
        title: manga.title,
        coverUrl: manga.coverUrl,
        source: manga.source,
      })}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors tactile ${
        fav
          ? "bg-accent-soft text-accent border-accent-border"
          : "bg-card border-border text-muted hover:text-foreground hover:border-accent-border"
      }`}
      aria-pressed={fav}
      aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <svg viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
      {fav ? "Favoritado" : "Favoritar"}
    </button>
  )
}

"use client"

import { useEffect, useState } from "react"

/**
 * Estado local persistente (localStorage) para favoritos e continuação de leitura.
 * Client-only — sempre inicializa no browser (evita hydration mismatch).
 */

export interface FavoriteItem {
  id: string
  title: string
  coverUrl: string | null
  source: string
  addedAt: number
}

export interface ContinueItem {
  mangaId: string
  chapterId: string
  chapterNumber: string
  title: string
  coverUrl: string | null
  source: string
  updatedAt: number
}

const FAV_KEY = "mhub:favorites"
const CONT_KEY = "mhub:continue"

function safeParse<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Hook genérico de estado persistido em localStorage */
export function useLocalList<T extends { [K in keyof T]: any }>(
  key: string,
): [T[], (updater: (current: T[]) => T[]) => void] {
  const [items, setItems] = useState<T[]>([])

  useEffect(() => {
    setItems(safeParse<T>(localStorage.getItem(key)))
  }, [key])

  const update = (updater: (current: T[]) => T[]) => {
    setItems(prev => {
      const next = updater(prev)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // localStorage cheio/indisponível — ignora
      }
      return next
    })
  }

  return [items, update]
}

// ---- Favoritos ----
export function useFavorites() {
  const [favorites, setFavorites] = useLocalList<FavoriteItem>(FAV_KEY)

  const isFavorite = (id: string) => favorites.some(f => f.id === id)

  const toggleFavorite = (item: Omit<FavoriteItem, "addedAt">) => {
    setFavorites(current => {
      const exists = current.some(f => f.id === item.id)
      if (exists) return current.filter(f => f.id !== item.id)
      return [{ ...item, addedAt: Date.now() }, ...current]
    })
  }

  return { favorites, isFavorite, toggleFavorite }
}

// ---- Continue Reading ----
export function useContinueReading() {
  const [items, setItems] = useLocalList<ContinueItem>(CONT_KEY)

  const markRead = (item: Omit<ContinueItem, "updatedAt">) => {
    setItems(current => [
      { ...item, updatedAt: Date.now() },
      ...current.filter(c => c.mangaId !== item.mangaId),
    ])
  }

  return { items, markRead }
}

export interface MangaFireSearchResult {
  id: string | null
  title: string | null
  poster: string | null
  type: string | null
}

export interface MangaFireSearchResponse {
  currentPage: number
  totalPages: number
  results: MangaFireSearchResult[]
}

export interface MangaFireManga {
  title: string | null
  altTitles: string | null
  poster: string | null
  status: string | null
  type: string | null
  description: string | null
  author: string | null
  published: string | null
  genres: string[]
  rating: string | null
}

export interface MangaFireChapter {
  number: string
  title: string | null
  chapterId: string
  language: string
  releaseDate: string | null
}

export function normalizeMangaId(urlSlug: string): string {
  return urlSlug
}

export function extractNumericId(slug: string): string | null {
  const match = slug.match(/(\d+)/)
  return match?.[1] || null
}

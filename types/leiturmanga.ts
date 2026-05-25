export interface LeituraMangaSearchResult {
  id: string
  title: string
  coverUrl: string | null
  latestChapter: string | null
}

export interface LeituraMangaManga {
  title: string
  coverUrl: string | null
  status: string | null
  author: string | null
  year: string | null
  genres: string[]
  description: string | null
  firstChapter: string | null
  lastChapter: string | null
}

export interface LeituraMangaChapter {
  number: string
  title: string | null
  chapterId: string
  date: string | null
}

export function extractSlug(pathname: string): string | null {
  const m = pathname.match(/\/manga\/([^/]+)/)
  return m?.[1] || null
}

export function extractChapterNumber(url: string): string | null {
  const m = url.match(/\/chapter\/(\d+(?:\.\d+)?)/)
  return m?.[1] || null
}

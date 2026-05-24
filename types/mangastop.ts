export interface MangaStopSearchResult {
  id: string
  title: string
  coverUrl: string | null
}

export interface MangaStopManga {
  title: string
  coverUrl: string | null
  status: string | null
  type: string | null
  author: string | null
  year: string | null
  genres: string[]
  description: string | null
}

export interface MangaStopChapter {
  number: string
  title: string | null
  chapterId: string
  date: string | null
}

export function extractSlug(chapterUrl: string): string | null {
  const match = chapterUrl.match(/^\/(.+?)-capitulo-\d+\/?$/)
  if (match) return match[1]
  const m2 = chapterUrl.match(/^\/(.+?)\/?$/)
  return m2 ? m2[1] : null
}

export function extractChapterNumber(chapterUrl: string): string | null {
  const match = chapterUrl.match(/-capitulo-(\d+(?:\.\d+)?)\/?$/)
  return match ? match[1] : null
}

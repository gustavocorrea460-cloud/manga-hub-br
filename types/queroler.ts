export interface QueroLerManga {
  title: string
  coverUrl: string | null
  status: string | null
  author: string | null
  year: string | null
  genres: string[]
  description: string | null
  altTitles: string[]
}

export interface QueroLerChapter {
  id: string
  number: string
  title: string | null
  date: string | null
  pdfUrl: string | null
}

export function extractUuidFromSlug(slug: string): string {
  const parts = slug.split("/")
  return parts[parts.length - 1] || parts[parts.length - 2] || slug
}

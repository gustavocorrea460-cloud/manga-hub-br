export interface Tag {
  id: string
  type: "tag"
  attributes: {
    name: { [lang: string]: string }
    group: string
  }
}

export interface Relationship {
  id: string
  type: string
  attributes?: Record<string, unknown>
}

export interface MangaAttributes {
  title: { [lang: string]: string }
  altTitles: { [lang: string]: string }[]
  description: { [lang: string]: string }
  status: "ongoing" | "completed" | "hiatus" | "cancelled"
  year: number | null
  contentRating: "safe" | "suggestive" | "erotica" | "pornographic"
  tags: Tag[]
  updatedAt: string
  latestChapter: string | null
}

export interface Manga {
  id: string
  type: "manga"
  attributes: MangaAttributes
  relationships: Relationship[]
}

export interface MangaResponse {
  result: "ok"
  response: "collection"
  data: Manga[]
  limit: number
  offset: number
  total: number
}

export interface SingleMangaResponse {
  result: "ok"
  response: "entity"
  data: Manga
}

export interface ChapterAttributes {
  chapter: string | null
  title: string | null
  pages: number
  publishAt: string
  translatedLanguage: string
  volume: string | null
}

export interface Chapter {
  id: string
  type: "chapter"
  attributes: ChapterAttributes
  relationships: Relationship[]
}

export interface ChapterResponse {
  result: "ok"
  response: "collection"
  data: Chapter[]
  limit: number
  offset: number
  total: number
}

export interface ChapterPages {
  baseUrl: string
  chapter: {
    hash: string
    data: string[]
    dataSaver: string[]
  }
}

export interface AtHomeResponse {
  result: "ok"
  baseUrl: string
  chapter: {
    hash: string
    data: string[]
    dataSaver: string[]
  }
}

export interface CoverAttributes {
  fileName: string
  volume: string | null
}

export interface CoverResponse {
  result: "ok"
  response: "entity"
  data: {
    id: string
    type: "cover_art"
    attributes: CoverAttributes
  }
}

export function getTitle(manga: Manga): string {
  return manga.attributes.title["pt-br"]
    || manga.attributes.title.en
    || Object.values(manga.attributes.title)[0]
    || "Sem título"
}

export function getDescription(manga: Manga): string {
  return manga.attributes.description["pt-br"]
    || manga.attributes.description.en
    || "Sem descrição"
}

export function getCoverFileName(manga: Manga): string | null {
  const cover = manga.relationships.find(r => r.type === "cover_art")
  if (!cover?.attributes) return null
  const attrs = cover.attributes as unknown as CoverAttributes
  return attrs.fileName
}

export function getCoverUrl(manga: Manga, size: "256" | "512" = "256"): string | null {
  const fileName = getCoverFileName(manga)
  if (!fileName) return null
  return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.${size}.jpg`
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ongoing: "Em andamento",
    completed: "Completo",
    hiatus: "Hiato",
    cancelled: "Cancelado",
  }
  return labels[status] || status
}

export function getContentRatingLabel(rating: string): string {
  const labels: Record<string, string> = {
    safe: "Livre",
    suggestive: "Sugestivo",
    erotica: "Erótico",
    pornographic: "Adulto",
  }
  return labels[rating] || rating
}

export function getScanlatorName(chapter: Chapter): string | null {
  const group = chapter.relationships.find(r => r.type === "scanlation_group")
  if (!group?.attributes) return null
  return (group.attributes as { name?: string }).name || null
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Tipos da API do Nexustoons.com (reversão 2026-09-04) */

export interface NexusCategory {
  id: number
  name: string
  slug: string
  description: string
  type: "genre" | "theme"
  isNsfw: boolean
}

export interface NexusManga {
  id: number
  slug: string
  title: string
  alternativeTitles: string
  description: string
  coverImage: string | null
  bannerImage: string | null
  author: string
  artist: string
  status: string
  type: string
  releaseYear: number | null
  rating: number
  views: number
  isNsfw: boolean
  isSuggestive: boolean
  isVipOnly: boolean
  vipCoinCost: number
  officialLink: string
  rawUrl: string
  publisher: string
  studio: string
  volumes: number
  muRating: number
  muVotes: number
  muLatestChapter: number
  muRelatedIds: string
  uploaderId: number | null
  lastChapterAt: string | null
  chapterCount: number
  createdAt: string
  updatedAt: string
  categories?: NexusCategory[]
  chapters?: NexusChapter[]
}

export interface NexusChapter {
  id: number
  mangaId: number
  number: string
  title: string | null
  views: number
  releaseStatus?: string
  accessLevel?: string
  coinCost?: number
  createdAt?: string
}

export interface NexusPage {
  imageUrl: string
  pageNumber: number
}

export interface NexusChapterDetail {
  id: number
  mangaId: number
  number: string
  title: string | null
  accessLevel: string
  contentType: string
  coinCost: number
  createdAt: string
  manga: NexusManga
  pages: NexusPage[]
  pageToken?: string
}

export interface NexusSearchResponse {
  data: NexusManga[] | null
  limit: number
  page: number
  pages: number
  total: number
}

export interface NexusMangaDetailResponse {
  alternativeTitles: string
  artist: string
  author: string
  bannerImage: string | null
  categories: NexusCategory[]
  chapters: NexusChapter[]
  description: string
  id: number
  slug: string
  status: string
  title: string
  type: string
  views: number
  rating: number
  releaseYear: number | null
  coverImage: string | null
  publisher: string
  studio: string
  volumes: number
  muRating: number
  muVotes: number
  isNsfw: boolean
  isSuggestive: boolean
  isVipOnly: boolean
  vipCoinCost: number
  lastChapterAt: string | null
  chapterCount: number
  createdAt: string
  updatedAt: string
}

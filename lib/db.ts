import { neon } from "@neondatabase/serverless"

let _sql: ReturnType<typeof neon> | null = null

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        "DATABASE_URL não configurada. Defina a variável de ambiente DATABASE_URL."
      )
    }
    _sql = neon(url)
  }
  return _sql
}

export interface CacheRow {
  id: string
  data: unknown
  updated_at: string
}

export async function getCache(id: string): Promise<CacheRow | null> {
  const sql = getSql()
  const rows = await sql`SELECT id, data, updated_at FROM manga_cache WHERE id = ${id}`
  const arr = rows as Record<string, unknown>[]
  return arr.length > 0 ? {
    id: arr[0].id as string,
    data: arr[0].data,
    updated_at: arr[0].updated_at as string,
  } : null
}

export async function setCache(
  id: string,
  data: unknown,
): Promise<void> {
  const sql = getSql()
  await sql`
    INSERT INTO manga_cache (id, data, updated_at)
    VALUES (${id}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
  `
}

export async function getChapterCache(id: string): Promise<CacheRow | null> {
  const sql = getSql()
  const rows =
    await sql`SELECT id, data, updated_at FROM chapter_cache WHERE id = ${id}`
  const arr = rows as Record<string, unknown>[]
  return arr.length > 0 ? {
    id: arr[0].id as string,
    data: arr[0].data,
    updated_at: arr[0].updated_at as string,
  } : null
}

export async function setChapterCache(
  id: string,
  mangaId: string,
  data: unknown,
): Promise<void> {
  const sql = getSql()
  await sql`
    INSERT INTO chapter_cache (id, manga_id, data, updated_at)
    VALUES (${id}, ${mangaId}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
  `
}

export async function getMangaListCache(
  key: string,
): Promise<CacheRow | null> {
  const sql = getSql()
  const rows = await sql`
    SELECT id, data, updated_at FROM manga_cache
    WHERE id = ${key} AND id NOT LIKE 'manga:%'
  `
  const arr = rows as Record<string, unknown>[]
  return arr.length > 0 ? {
    id: arr[0].id as string,
    data: arr[0].data,
    updated_at: arr[0].updated_at as string,
  } : null
}

export interface CatalogEntry {
  id: string
  source: string
  slug: string
  title: string
  metadata: Record<string, unknown>
  chapters: Record<string, unknown>[]
  updated_at: string
}

export async function setCatalogEntry(entry: {
  source: string
  slug: string
  title: string
  metadata: Record<string, unknown>
  chapters: Record<string, unknown>[]
}): Promise<void> {
  const sql = getSql()
  const id = `${entry.source}:${entry.slug}`
  await sql`
    INSERT INTO manga_catalog (id, source, slug, title, metadata, chapters, updated_at)
    VALUES (${id}, ${entry.source}, ${entry.slug}, ${entry.title},
            ${JSON.stringify(entry.metadata)}::jsonb,
            ${JSON.stringify(entry.chapters)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET title = ${entry.title},
                  metadata = ${JSON.stringify(entry.metadata)}::jsonb,
                  chapters = ${JSON.stringify(entry.chapters)}::jsonb,
                  updated_at = NOW()
  `
}

export async function getCatalogCount(source: string): Promise<number> {
  const sql = getSql()
  const rows = await sql`SELECT COUNT(*) as count FROM manga_catalog WHERE source = ${source}`
  const arr = rows as Record<string, unknown>[]
  return Number(arr[0]?.count || 0)
}

export async function setMangaListCache(
  key: string,
  data: unknown,
): Promise<void> {
  const sql = getSql()
  await sql`
    INSERT INTO manga_cache (id, data, updated_at)
    VALUES (${key}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
  `
}

export interface CatalogEntryRow {
  id: string
  source: string
  slug: string
  title: string
  metadata: Record<string, unknown>
  chapters: Record<string, unknown>[]
  updated_at: string
}

export async function getCatalogEntries(
  source: string,
  page: number = 1,
  limit: number = 30,
): Promise<{ entries: CatalogEntryRow[]; total: number }> {
  const sql = getSql()
  const offset = (page - 1) * limit
  const rows = await sql`
    SELECT * FROM manga_catalog
    WHERE source = ${source}
    ORDER BY title ASC
    LIMIT ${limit} OFFSET ${offset}
  `
  const countRows = await sql`SELECT COUNT(*) as count FROM manga_catalog WHERE source = ${source}`
  const total = Number((countRows as Record<string, unknown>[])[0]?.count || 0)
  return {
    entries: rows as unknown as CatalogEntryRow[],
    total,
  }
}

export async function deleteExpiredCache(hours: number = 24): Promise<void> {
  const sql = getSql()
  await sql`DELETE FROM manga_cache WHERE updated_at < NOW() - INTERVAL '1 hour' * ${hours}`
  await sql`DELETE FROM chapter_cache WHERE updated_at < NOW() - INTERVAL '1 hour' * ${hours}`
}

export async function runMigration(): Promise<void> {
  const sql = getSql()
  await sql`CREATE TABLE IF NOT EXISTS manga_cache (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX IF NOT EXISTS idx_manga_cache_updated
    ON manga_cache(updated_at DESC)`
  await sql`CREATE TABLE IF NOT EXISTS chapter_cache (
    id TEXT PRIMARY KEY,
    manga_id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX IF NOT EXISTS idx_chapter_cache_manga
    ON chapter_cache(manga_id)`
  await sql`CREATE INDEX IF NOT EXISTS idx_chapter_cache_updated
    ON chapter_cache(updated_at DESC)`
  await sql`CREATE TABLE IF NOT EXISTS manga_catalog (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    metadata JSONB,
    chapters JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX IF NOT EXISTS idx_manga_catalog_source
    ON manga_catalog(source)`
  await sql`CREATE INDEX IF NOT EXISTS idx_manga_catalog_title
    ON manga_catalog(title)`
}

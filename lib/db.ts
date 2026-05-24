import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface CacheRow {
  id: string
  data: unknown
  updated_at: string
}

export async function getCache(id: string): Promise<CacheRow | null> {
  const rows = await sql.query(
    "SELECT id, data, updated_at FROM manga_cache WHERE id = $1",
    [id]
  )
  return rows.length > 0 ? {
    id: rows[0].id as string,
    data: rows[0].data,
    updated_at: rows[0].updated_at as string,
  } : null
}

export async function setCache(
  id: string,
  data: unknown,
): Promise<void> {
  await sql.query(
    `INSERT INTO manga_cache (id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
    [id, JSON.stringify(data)]
  )
}

export async function getChapterCache(id: string): Promise<CacheRow | null> {
  const rows = await sql.query(
    "SELECT id, data, updated_at FROM chapter_cache WHERE id = $1",
    [id]
  )
  return rows.length > 0 ? {
    id: rows[0].id as string,
    data: rows[0].data,
    updated_at: rows[0].updated_at as string,
  } : null
}

export async function setChapterCache(
  id: string,
  mangaId: string,
  data: unknown,
): Promise<void> {
  await sql.query(
    `INSERT INTO chapter_cache (id, manga_id, data, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = $3::jsonb, updated_at = NOW()`,
    [id, mangaId, JSON.stringify(data)]
  )
}

export async function getMangaListCache(
  key: string,
): Promise<CacheRow | null> {
  const rows = await sql.query(
    `SELECT id, data, updated_at FROM manga_cache
     WHERE id LIKE $1 AND id NOT LIKE 'manga:%'`,
    [key]
  )
  return rows.length > 0 ? {
    id: rows[0].id as string,
    data: rows[0].data,
    updated_at: rows[0].updated_at as string,
  } : null
}

export async function setMangaListCache(
  key: string,
  data: unknown,
): Promise<void> {
  await sql.query(
    `INSERT INTO manga_cache (id, data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
    [key, JSON.stringify(data)]
  )
}

export async function deleteExpiredCache(hours: number = 24): Promise<void> {
  await sql.query(
    "DELETE FROM manga_cache WHERE updated_at < NOW() - INTERVAL '1 hour' * $1",
    [hours]
  )
  await sql.query(
    "DELETE FROM chapter_cache WHERE updated_at < NOW() - INTERVAL '1 hour' * $1",
    [hours]
  )
}

export async function runMigration(): Promise<void> {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS manga_cache (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_manga_cache_updated
      ON manga_cache(updated_at DESC);

    CREATE TABLE IF NOT EXISTS chapter_cache (
      id TEXT PRIMARY KEY,
      manga_id TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chapter_cache_manga
      ON chapter_cache(manga_id);

    CREATE INDEX IF NOT EXISTS idx_chapter_cache_updated
      ON chapter_cache(updated_at DESC);
  `)
}

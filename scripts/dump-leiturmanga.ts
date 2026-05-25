import { getAllLeituraMangaSlugs } from "@/lib/api/sitemap"
import { getLeituraMangaCached, getLeituraMangaChaptersCached } from "@/lib/cache"
import { setCatalogEntry, getCatalogCount, getSql } from "@/lib/db"

const isQuick = process.argv.includes("--quick")
const RATE_LIMIT_MS = isQuick ? 150 : 400

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function ensureMigration() {
  const sql = getSql()
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
  console.log("  Tabela manga_catalog garantida.")
}

async function main() {
  console.log("")
  console.log("╔══════════════════════════════════════════════╗")
  console.log("║   Dump do Catálogo LeituraManga.net         ║")
  console.log("╚══════════════════════════════════════════════╝")
  console.log("")

  console.log("[1/3] Garantindo schema do banco...")
  await ensureMigration()

  console.log("[2/3] Obtendo slugs dos sitemaps...")
  const slugs = await getAllLeituraMangaSlugs()
  console.log(`  Total: ${slugs.length} mangás encontrados nos sitemaps.`)
  console.log("")

  if (slugs.length === 0) {
    console.log("  Nenhum slug encontrado. Abortando.")
    return
  }

  console.log("[3/3] Iniciando dump...")
  console.log("")

  let success = 0
  let errors = 0

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    const progress = `[${i + 1}/${slugs.length}]`

    try {
      const manga = await getLeituraMangaCached(slug)
      await sleep(RATE_LIMIT_MS)

      const chapters = await getLeituraMangaChaptersCached(slug)
      await sleep(RATE_LIMIT_MS)

      await setCatalogEntry({
        source: "leiturmanga",
        slug,
        title: manga.title || slug,
        metadata: {
          coverUrl: manga.coverUrl,
          status: manga.status,
          author: manga.author,
          year: manga.year,
          genres: manga.genres,
          description: manga.description,
        },
        chapters: chapters.map(ch => ({
          number: ch.number,
          title: ch.title,
          chapterId: ch.chapterId,
          date: ch.date,
        })),
      })

      success++
      if ((i + 1) % 50 === 0 || i === 0) {
        const total = await getCatalogCount("leiturmanga")
        console.log(`  ${progress} ${slug} ✅  (${total} no banco, ${errors} erros)`)
      }
    } catch (err) {
      errors++
      console.error(`  ${progress} ${slug} ❌ ${err instanceof Error ? err.message.slice(0, 80) : String(err)}`)
    }
  }

  console.log("")
  console.log("╔══════════════════════════════════════════════╗")
  console.log("║   RESUMO                                    ║")
  console.log("╠══════════════════════════════════════════════╣")
  console.log(`║  Total:    ${String(slugs.length).padStart(5)} mangás              ║`)
  console.log(`║  Sucesso:  ${String(success).padStart(5)}                     ║`)
  console.log(`║  Erros:    ${String(errors).padStart(5)}                     ║`)
  console.log("╚══════════════════════════════════════════════╝")
  console.log("")

  if (errors > 0) {
    process.exit(1)
  }
}

main()

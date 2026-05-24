const MANGA_SITEMAPS = [
  "https://mangastop.net/manga-sitemap.xml",
  "https://mangastop.net/manga-sitemap2.xml",
  "https://mangastop.net/manga-sitemap3.xml",
]

const TIMEOUT = 20000

function extractSlug(url: string): string | null {
  const match = url.match(/\/manga\/([^/]+)\//)
  return match ? decodeURIComponent(match[1]) : null
}

export async function getAllMangaStopSlugs(): Promise<string[]> {
  const slugs = new Set<string>()

  for (const sitemapUrl of MANGA_SITEMAPS) {
    console.log(`  Fetching ${sitemapUrl}...`)
    const res = await fetch(sitemapUrl, {
      signal: AbortSignal.timeout(TIMEOUT),
    })
    if (!res.ok) {
      console.warn(`  Sitemap ${sitemapUrl} failed: ${res.status}`)
      continue
    }
    const xml = await res.text()

    const locRegex = /<loc>([^<]+)<\/loc>/g
    let match: RegExpExecArray | null
    let count = 0
    while ((match = locRegex.exec(xml)) !== null) {
      const loc = match[1].trim()
      const slug = extractSlug(loc)
      if (slug) {
        slugs.add(slug)
        count++
      }
    }
    console.log(`  Found ${count} manga URLs from ${sitemapUrl}`)
  }

  return Array.from(slugs).sort()
}

const MANGA_SITEMAPS = [
  "https://mangastop.net/manga-sitemap.xml",
  "https://mangastop.net/manga-sitemap2.xml",
  "https://mangastop.net/manga-sitemap3.xml",
]

const LEITURMANGA_SITEMAP = "https://leituramanga.net/sitemap.xml"
const LEITURMANGA_SITEMAP_MANGA = "https://leituramanga.net/manga-sitemap.xml"

const TIMEOUT = 20000

function extractSlug(url: string): string | null {
  const match = url.match(/\/manga\/([^/]+)\//)
  return match ? decodeURIComponent(match[1]) : null
}

export async function getAllLeituraMangaSlugs(): Promise<string[]> {
  const slugs = new Set<string>()

  const res = await fetch(LEITURMANGA_SITEMAP_MANGA, {
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) {
    console.warn(`LeituraManga sitemap failed: ${res.status}`)
    return []
  }
  const xml = await res.text()

  const manualSitemaps: string[] = []
  const smRegex = /<loc>([^<]+sitemap[^<]*)<\/loc>/gi
  let smMatch: RegExpExecArray | null
  while ((smMatch = smRegex.exec(xml)) !== null) {
    manualSitemaps.push(smMatch[1].trim())
  }

  if (manualSitemaps.length === 0) {
    const locRegex = /<loc>([^<]+)<\/loc>/g
    let match: RegExpExecArray | null
    while ((match = locRegex.exec(xml)) !== null) {
      const loc = match[1].trim()
      if (loc.includes("/manga/")) {
        const slug = extractSlug(loc)
        if (slug) slugs.add(slug)
      }
    }
  } else {
    for (const sitemapUrl of manualSitemaps) {
      const subRes = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(TIMEOUT),
      })
      if (!subRes.ok) continue
      const subXml = await subRes.text()
      const locRegex = /<loc>([^<]+)<\/loc>/g
      let match: RegExpExecArray | null
      while ((match = locRegex.exec(subXml)) !== null) {
        const loc = match[1].trim()
        if (loc.includes("/manga/")) {
          const slug = extractSlug(loc)
          if (slug) slugs.add(slug)
        }
      }
    }
  }

  return Array.from(slugs).sort()
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

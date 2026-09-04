import { NextResponse } from "next/server"
import { SOURCES } from "@/lib/api/registry"

/**
 * GET /api/health?source=mangastop
 * Health check rápido por fonte (ou todas se sem source).
 * Verifica se a fonte está no ar respondendo um mínimo de conteúdo.
 *
 * Ex: /api/health → { sources: [{ id, status, latencyMs, checkedAt }] }
 * Ex: /api/health?source=queroler → { id, status, latencyMs, checkedAt }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sourceParam = searchParams.get("source") as keyof typeof SOURCES | null

  const targets = sourceParam && SOURCES[sourceParam]
    ? [SOURCES[sourceParam]]
    : Object.values(SOURCES)

  const results = await Promise.all(
    targets.map(async (meta) => {
      const started = Date.now()
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 6000)

        // URL de health check por fonte (algumas não respondem na raiz):
        // - queroler: a raiz retorna 404; usar o endpoint de busca
        const healthUrl =
          meta.id === "queroler"
            ? `${meta.baseUrl}/manga/?query=one+piece`
            : meta.baseUrl

        // Ping leve no site externo da fonte — mede se a fonte está no ar
        // respondendo mínimo conteúdo.
        const res = await fetch(healthUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; MangaHubBR/1.0)",
          },
          signal: controller.signal,
          redirect: "follow",
          cache: "no-store",
        })
        clearTimeout(timeout)

        const latency = Date.now() - started
        const ok = res.status >= 200 && res.status < 400
        const body = await res.text().catch(() => "")
        const hasContent = body.length > 200

        return {
          id: meta.id,
          label: meta.label,
          status: ok && hasContent ? "up" : "degraded",
          httpStatus: res.status,
          latencyMs: latency,
          hasContent,
          checkedAt: new Date().toISOString(),
        }
      } catch (err) {
        return {
          id: meta.id,
          label: meta.label,
          status: "down",
          httpStatus: null,
          latencyMs: Date.now() - started,
          hasContent: false,
          error: err instanceof Error ? err.message : "unknown",
          checkedAt: new Date().toISOString(),
        }
      }
    }),
  )

  if (sourceParam) {
    return NextResponse.json(results[0])
  }
  return NextResponse.json({ sources: results, total: results.length })
}

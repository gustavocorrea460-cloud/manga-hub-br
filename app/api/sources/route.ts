import { NextResponse } from "next/server"
import { SOURCE_LIST } from "@/lib/api/registry"

/**
 * GET /api/sources
 * Descobre as fontes de dados disponíveis (padrão comick-source-api).
 * Útil para: source toggle, UI de seleção de fonte, debugging.
 */
export async function GET() {
  const sources = SOURCE_LIST.map((s) => ({
    id: s.id,
    name: s.label,
    label: s.label,
    type: s.type,
    scope: s.scope,
    color: s.color,
    baseUrl: s.baseUrl,
    searchable: s.searchable,
    readable: s.readable,
    cachePrefix: s.cachePrefix,
    status: s.status,
    description: s.description,
  }))

  return NextResponse.json({ sources, total: sources.length })
}

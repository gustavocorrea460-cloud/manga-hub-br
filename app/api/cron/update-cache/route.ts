import { NextResponse } from "next/server"
import { getLatestMangas } from "@/lib/api/mangadex"
import { setMangaListCache } from "@/lib/db"

export const dynamic = "force-static"
export const revalidate = 0

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const results: string[] = []

    for (let page = 1; page <= 3; page++) {
      const mangas = await getLatestMangas(page, 100)
      const cacheKey = `latest:page:${page}`
      await setMangaListCache(cacheKey, mangas)
      results.push(`Página ${page}: ${mangas.length} mangás`)
    }

    return NextResponse.json({
      success: true,
      message: "Cache atualizado",
      details: results,
    })
  } catch (error) {
    console.error("Erro no cron update-cache:", error)
    return NextResponse.json(
      { success: false, error: "Falha ao atualizar cache" },
      { status: 500 }
    )
  }
}

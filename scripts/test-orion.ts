import { getOrionCrypto } from "../lib/api/orion"

async function main() {
  const crypto = getOrionCrypto()

  // Teste 1: decriptar o payload que capturamos do read/194900
  const { execSync } = await import("child_process")
  const fs = await import("fs")
  const payload = JSON.parse(fs.readFileSync("/tmp/opencode/nexus/read-194900.network-response", "utf8"))
  const plain = crypto.decryptPayload(payload)
  const parsed = JSON.parse(plain)
  console.log("✔ Decrypt OK - páginas:", parsed.pages?.length, "| cap:", parsed.number)
  console.log("✔ Primeira página:", parsed.pages?.[0]?.imageUrl)

  // Teste 2: buscar na API real
  const res = await fetch(`https://nexustoons.com/api/mangas?q=one+piece&limit=5`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  })
  const searchJson = await res.json()
  console.log("✔ Search (sem crypto):", searchJson.total, "resultados")

  // Teste 3: detalhes de manga (criptografado)
  const detailRes = await fetch(`https://nexustoons.com/api/manga/pico-marcial`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  const detailJson = await detailRes.json()
  if (detailJson.d && detailJson.k !== undefined) {
    const plainDetail = crypto.decryptPayload(detailJson)
    const detail = JSON.parse(plainDetail)
    console.log("✔ Detail decrypt OK - título:", detail.title, "| caps:", detail.chapters?.length)
  } else {
    console.log("Detail NÃO criptografado:", JSON.stringify(detailJson).slice(0, 100))
  }
}

main().catch(e => { console.error("FALHOU:", e.message); process.exit(1) })

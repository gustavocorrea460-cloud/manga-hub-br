import { runMigration } from "@/lib/db"

async function main() {
  console.log("Rodando migração do banco...")
  try {
    await runMigration()
    console.log("Migração concluída com sucesso!")
  } catch (error) {
    console.error("Erro na migração:", error)
    process.exit(1)
  }
}

main()

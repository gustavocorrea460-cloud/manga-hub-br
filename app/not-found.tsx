import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <h1 className="text-6xl font-bold text-accent">404</h1>
      <p className="text-lg text-muted">Página não encontrada</p>
      <Link
        href="/"
        className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

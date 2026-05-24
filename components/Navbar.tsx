"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Navbar() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-4 h-14">
        <Link
          href="/"
          className="text-lg font-bold text-accent hover:text-accent-hover transition-colors shrink-0"
        >
          Manga Hub BR
        </Link>

        <form onSubmit={handleSubmit} className="flex-1 max-w-md">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar mangás..."
            className="w-full rounded-lg bg-card border border-border px-4 py-1.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
          />
        </form>

        <Link
          href="/busca"
          className="text-sm text-muted hover:text-foreground transition-colors shrink-0"
        >
          Busca avançada
        </Link>
      </div>
    </nav>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface Props {
  initialQuery?: string
}

export default function SearchBar({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Digite o nome do mangá..."
          className="w-full rounded-xl bg-card border border-border px-5 py-3.5 text-base text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
          autoFocus
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          Buscar
        </button>
      </div>
    </form>
  )
}

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
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar mangás por título..."
        className="w-full rounded-xl bg-card border border-border px-4 py-3 text-foreground placeholder-muted outline-none focus:border-accent transition-colors text-sm"
      />
    </form>
  )
}

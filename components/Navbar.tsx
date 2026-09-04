"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

export default function Navbar() {
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const links = [
    { label: "Início", href: "/" },
    { label: "Busca", href: "/busca" },
    { label: "Catálogo", href: "/catalogo" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4 px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <span className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <path d="M12 7v14" />
              <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
            </svg>
          </span>
          <span className="text-base font-bold text-accent hover:text-accent-hover transition-colors">
            Manga Hub BR
          </span>
        </Link>

        <form onSubmit={handleSubmit} className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar mangás..."
              aria-label="Buscar mangás"
              className="w-full rounded-lg bg-card border border-border pl-9 pr-4 py-1.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </span>
          </div>
        </form>

        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-md text-sm text-muted hover:text-foreground hover:bg-card transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Menu mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden p-2 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors"
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
            {menuOpen ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Dropdown mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            <form onSubmit={handleSubmit} className="mb-2 sm:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar mangás..."
                  aria-label="Buscar mangás"
                  className="w-full rounded-lg bg-card border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  <SearchIcon />
                </span>
              </div>
            </form>
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-md text-sm text-muted hover:text-foreground hover:bg-card transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}

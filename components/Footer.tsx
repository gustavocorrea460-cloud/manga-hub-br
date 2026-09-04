import Link from "next/link"

const links = [
  { label: "Início", href: "/" },
  { label: "Buscar", href: "/busca" },
  { label: "Catálogo", href: "/catalogo" },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted">
            <span className="text-accent font-semibold">Manga Hub BR</span>
            <span className="mx-2 text-border-strong">·</span>
            <span>Mangás em português, grátis.</span>
          </div>
          <nav className="flex items-center gap-4" aria-label="Footer">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-4 text-[11px] text-muted/70 text-center sm:text-left leading-relaxed">
          O conteúdo é propriedade de seus respectivos autores e editores. Este site não
          hospeda nenhuma imagem — apenas agrega links públicos. Suporte os criadores.
        </p>
      </div>
    </footer>
  )
}

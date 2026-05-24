import Link from "next/link"

interface Props {
  currentPage: number
  total: number
  limit: number
  basePath: string
  paramName?: string
}

export default function Pagination({
  currentPage,
  total,
  limit,
  basePath,
  paramName = "page",
}: Props) {
  const totalPages = Math.ceil(total / limit)

  if (totalPages <= 1) return null

  function href(page: number) {
    if (page <= 1) return basePath
    const separator = basePath.includes("?") ? "&" : "?"
    return `${basePath}${separator}${paramName}=${page}`
  }

  const pages: (number | "...")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="Paginação">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted hover:text-foreground hover:border-accent transition-colors"
        >
          ← Anterior
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted text-sm">
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              p === currentPage
                ? "bg-accent text-white"
                : "bg-card border border-border text-muted hover:text-foreground hover:border-accent"
            }`}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted hover:text-foreground hover:border-accent transition-colors"
        >
          Próxima →
        </Link>
      )}
    </nav>
  )
}

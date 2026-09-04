import Link from "next/link"
import { SOURCE_LIST } from "@/lib/api/registry"

interface Props {
  current: string
  /** Query string base (ex: `q=one+piece`) */
  query?: string
  /** Fontes disponíveis — default: todas ativas do registry */
  sources?: string[]
  size?: "sm" | "md"
}

/**
 * Toggle de fontes — alimentado pelo registry (fonte única de verdade).
 * Só exibe fontes com status "active" (QueroLer down fica oculto).
 */
export default function SourceToggle({ current, query, sources, size = "md" }: Props) {
  const baseUrl = query ? `/busca?q=${encodeURIComponent(query)}` : "/busca"
  const active = SOURCE_LIST.filter(s => s.status === "active")
  const list = sources
    ? active.filter(s => sources.includes(s.id))
    : active

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Fontes de dados">
      {list.map(s => {
        const isActive = current === s.id
        const href = isActive
          ? baseUrl
          : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}source=${s.id}`
        return (
          <Link
            key={s.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all tactile ${
              isActive
                ? "bg-accent text-white shadow-accent"
                : "bg-card border border-border text-muted hover:text-foreground hover:border-accent-border"
            }`}
          >
            {s.label}
          </Link>
        )
      })}
    </div>
  )
}

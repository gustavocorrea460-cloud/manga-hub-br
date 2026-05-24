export type SourceId = "mangadex" | "mangafire" | "mangastop"

interface Props {
  source: SourceId
  size?: "sm" | "xs"
}

const labels: Record<SourceId, string> = {
  mangadex: "MangaDex",
  mangafire: "MangaFire",
  mangastop: "MangaStop",
}

const colors: Record<SourceId, string> = {
  mangadex: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  mangafire: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  mangastop: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
}

export default function SourceBadge({ source, size = "sm" }: Props) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border leading-none
        ${size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"}
        ${colors[source]}`}
    >
      {labels[source]}
    </span>
  )
}

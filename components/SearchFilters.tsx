"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import type { Tag, FilterOrder } from "@/types/mangadex"
import {
  getDemographicTags,
  getGenreTags,
  getThemeTags,
  getFormatTags,
} from "@/types/mangadex"

interface Props {
  tags: Tag[]
}

type TagState = Record<string, "include" | "exclude">

function parseTagState(included: string[], excluded: string[]): TagState {
  const state: TagState = {}
  included.forEach(id => (state[id] = "include"))
  excluded.forEach(id => (state[id] = "exclude"))
  return state
}

const STATUS_OPTIONS = [
  { value: "ongoing", label: "Em andamento" },
  { value: "completed", label: "Completo" },
  { value: "hiatus", label: "Hiato" },
  { value: "cancelled", label: "Cancelado" },
] as const

const ORDER_OPTIONS: { value: FilterOrder; label: string }[] = [
  { value: "relevance", label: "Relevância" },
  { value: "latestUpload", label: "Última atualização" },
  { value: "title", label: "Título (A-Z)" },
  { value: "year", label: "Ano" },
]

interface CollapsibleProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Collapsible({ title, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full text-sm font-medium text-foreground py-1.5"
      >
        {title}
        <span className="text-muted text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  )
}

function StatusCheckboxes({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (values: string[]) => void
}) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => toggle(opt.value)}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            selected.includes(opt.value)
              ? "bg-accent text-white border-accent"
              : "bg-card text-muted border-border hover:text-foreground hover:border-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function OrderRadio({
  value,
  onChange,
}: {
  value: FilterOrder
  onChange: (value: FilterOrder) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ORDER_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
            value === opt.value
              ? "bg-accent text-white border-accent"
              : "bg-card text-muted border-border hover:text-foreground hover:border-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function YearInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type="number"
      min={1980}
      max={2030}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Ex: 2020"
      className="w-full rounded-lg bg-card border border-border px-3 py-1.5 text-sm text-foreground placeholder-muted outline-none focus:border-accent transition-colors"
    />
  )
}

function TagPill({
  tag,
  state,
  label,
  onToggle,
}: {
  tag: Tag
  state: "off" | "include" | "exclude"
  label: string
  onToggle: (id: string) => void
}) {
  const base = "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer select-none"
  if (state === "include") {
    return (
      <button
        onClick={() => onToggle(tag.id)}
        className={`${base} bg-accent text-white border-accent`}
        title="Incluído (clique para remover)"
      >
        {label} ✓
      </button>
    )
  }
  if (state === "exclude") {
    return (
      <button
        onClick={() => onToggle(tag.id)}
        className={`${base} bg-card text-muted/50 border-border line-through`}
        title="Excluído (clique para remover)"
      >
        {label} ✗
      </button>
    )
  }
  return (
    <button
      onClick={() => onToggle(tag.id)}
      className={`${base} bg-card text-muted border-border hover:text-foreground hover:border-accent`}
      title="Clique para incluir"
    >
      {label}
    </button>
  )
}

function TagGrid({
  tags,
  tagState,
  onToggle,
}: {
  tags: Tag[]
  tagState: TagState
  onToggle: (id: string) => void
}) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(tag => {
        const label = tag.attributes.name["pt-br"]
          || tag.attributes.name.en
          || tag.attributes.name.ja
          || ""
        const state = tagState[tag.id] || "off"
        return (
          <TagPill key={tag.id} tag={tag} state={state} label={label} onToggle={onToggle} />
        )
      })}
    </div>
  )
}

export default function SearchFilters({ tags }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const currentStatus = searchParams.get("status")?.split(",").filter(Boolean) || []
  const currentOrder = (searchParams.get("order") as FilterOrder) || "relevance"
  const currentYear = searchParams.get("year") || ""
  const currentIncluded = searchParams.get("includedTags")?.split(",").filter(Boolean) || []
  const currentExcluded = searchParams.get("excludedTags")?.split(",").filter(Boolean) || []

  const tagState = parseTagState(currentIncluded, currentExcluded)

  const hasActiveFilters = currentStatus.length > 0
    || currentOrder !== "relevance"
    || currentYear
    || currentIncluded.length > 0
    || currentExcluded.length > 0

  const buildUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const p = new URLSearchParams()
      const q = searchParams.get("q")
      if (q) p.set("q", q)
      for (const [key, value] of Object.entries(updates)) {
        if (value) p.set(key, value)
      }
      return `/busca?${p.toString()}`
    },
    [searchParams],
  )

  function setStatus(values: string[]) {
    router.push(buildUrl(values.length > 0 ? { status: values.join(",") } : { status: null }))
  }

  function setOrder(value: FilterOrder) {
    router.push(buildUrl(value !== "relevance" ? { order: value } : { order: null }))
  }

  function setYear(value: string) {
    router.push(buildUrl(value ? { year: value } : { year: null }))
  }

  function toggleTag(id: string) {
    const current: TagState = { ...tagState }
    const p = new URLSearchParams(searchParams.toString())

    if (current[id] === "include") {
      delete current[id]
    } else if (current[id] === "exclude") {
      delete current[id]
    } else {
      current[id] = "include"
    }

    const included = Object.entries(current)
      .filter(([, v]) => v === "include")
      .map(([k]) => k)
    const excluded = Object.entries(current)
      .filter(([, v]) => v === "exclude")
      .map(([k]) => k)

    if (included.length > 0) p.set("includedTags", included.join(","))
    else p.delete("includedTags")
    if (excluded.length > 0) p.set("excludedTags", excluded.join(","))
    else p.delete("excludedTags")
    p.delete("page")

    router.push(`/busca?${p.toString()}`)
  }

  function clearFilters() {
    const p = new URLSearchParams()
    const q = searchParams.get("q")
    if (q) p.set("q", q)
    router.push(`/busca?${p.toString()}`)
  }

  const demographicTags = getDemographicTags(tags)
  const genreTags = getGenreTags(tags)
  const themeTags = getThemeTags(tags)
  const formatTags = getFormatTags(tags)

  if (tags.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-accent" />
          )}
          <span className="text-xs">{open ? "▲" : "▼"}</span>
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {open && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <Collapsible title="Status">
            <StatusCheckboxes selected={currentStatus} onChange={setStatus} />
          </Collapsible>

          <Collapsible title="Ordenação">
            <OrderRadio value={currentOrder} onChange={setOrder} />
          </Collapsible>

          <Collapsible title="Ano">
            <YearInput value={currentYear} onChange={setYear} />
          </Collapsible>

          {demographicTags.length > 0 && (
            <Collapsible title="Demografia" defaultOpen>
              <TagGrid tags={demographicTags} tagState={tagState} onToggle={toggleTag} />
            </Collapsible>
          )}

          {genreTags.length > 0 && (
            <Collapsible title="Gêneros" defaultOpen>
              <TagGrid tags={genreTags} tagState={tagState} onToggle={toggleTag} />
            </Collapsible>
          )}

          {themeTags.length > 0 && (
            <Collapsible title="Temas">
              <TagGrid tags={themeTags} tagState={tagState} onToggle={toggleTag} />
            </Collapsible>
          )}

          {formatTags.length > 0 && (
            <Collapsible title="Formatos">
              <TagGrid tags={formatTags} tagState={tagState} onToggle={toggleTag} />
            </Collapsible>
          )}
        </div>
      )}
    </div>
  )
}

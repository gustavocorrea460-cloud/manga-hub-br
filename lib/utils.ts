import { formatDistanceToNow, format, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (!isValid(date)) return "Data desconhecida"
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (!isValid(date)) return "—"
  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ")
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trim() + "…"
}

export function formatChapter(num: string | null): string {
  if (num === null) return "—"
  return `Capítulo ${parseFloat(num)}`
}

export function leitorUrl(chapterId: string, mangaId?: string): string {
  if (mangaId) return `/leitor/${chapterId}?mangaId=${mangaId}`
  return `/leitor/${chapterId}`
}

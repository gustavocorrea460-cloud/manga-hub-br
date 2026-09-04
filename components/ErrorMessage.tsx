import Link from "next/link"

interface Props {
  message?: string
}

export default function ErrorMessage({
  message = "Algo deu errado ao carregar os dados.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-error/10 border border-error/25 flex items-center justify-center text-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-muted text-center max-w-md leading-relaxed">{message}</p>
      <Link
        href="/"
        className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors tactile"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

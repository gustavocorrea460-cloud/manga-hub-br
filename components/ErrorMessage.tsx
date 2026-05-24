import Link from "next/link"

interface Props {
  message?: string
}

export default function ErrorMessage({
  message = "Algo deu errado ao carregar os dados.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="text-4xl">😕</div>
      <p className="text-muted text-center max-w-md">{message}</p>
      <Link
        href="/"
        className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  )
}

"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="text-4xl">😕</div>
      <h1 className="text-xl font-bold">Algo deu errado</h1>
      <p className="text-muted text-sm max-w-md text-center">
        Ocorreu um erro inesperado. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}

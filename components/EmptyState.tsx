interface Props {
  title: string
  description?: string
}

export default function EmptyState({
  title,
  description,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <p className="text-lg font-medium text-muted">{title}</p>
      {description && (
        <p className="text-sm text-muted/60 text-center max-w-md">{description}</p>
      )}
    </div>
  )
}

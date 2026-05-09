import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  ctaLabel?: string
  onCta?: () => void
  icon?: React.ReactNode
}

export function EmptyState({ title, description, ctaLabel, onCta, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      {icon && <div className="text-gray-300">{icon}</div>}
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {ctaLabel && onCta && (
        <Button variant="secondary" size="sm" onClick={onCta}>{ctaLabel}</Button>
      )}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <p className="font-medium text-gray-800">Couldn't load content</p>
      <p className="text-sm text-gray-500">Please check your connection and try again.</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
      )}
    </div>
  )
}

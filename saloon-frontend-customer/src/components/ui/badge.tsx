import { cn } from '@/lib/utils'

type Variant = 'default' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'in_progress' | 'pending'

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
  no_show: 'bg-orange-50 text-orange-700',
  in_progress: 'bg-violet-50 text-violet-700',
  pending: 'bg-yellow-50 text-yellow-700',
}

const labelMap: Record<string, string> = {
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
  in_progress: 'In Progress',
  pending_payment: 'Pending',
}

export function StatusBadge({ status }: { status: string }) {
  const variant = (status as Variant) in variantStyles ? (status as Variant) : 'default'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variantStyles[variant])}>
      {labelMap[status] ?? status}
    </span>
  )
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700', className)}>
      {children}
    </span>
  )
}

// Re-export common UI components for the barber app
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2, X, Eye, EyeOff } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import * as ToastPrimitive from '@radix-ui/react-toast'

// ---- Button ----
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200',
        ghost: 'hover:bg-gray-100 text-gray-700',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
        outline: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
      },
      size: { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base', icon: 'h-9 w-9' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean; loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'

// ---- Input ----
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, label, error, id, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <input id={inputId} ref={ref} className={cn(
        'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50',
        error && 'border-red-400', className,
      )} {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
Input.displayName = 'Input'

export function PasswordInput(props: InputProps) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input {...props} type={show ? 'text' : 'password'} className="pr-10" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-[28px] text-gray-400">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ---- Badge / status ----
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: 'bg-blue-50 text-blue-700',
    in_progress: 'bg-violet-50 text-violet-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-700',
    no_show: 'bg-orange-50 text-orange-700',
  }
  const label: Record<string, string> = {
    confirmed: 'Confirmed', in_progress: 'In Progress', completed: 'Completed',
    cancelled: 'Cancelled', no_show: 'No-show',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', map[status] ?? 'bg-gray-100 text-gray-700')}>
      {label[status] ?? status}
    </span>
  )
}

// ---- Skeleton ----
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-gray-100', className)} />
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, className }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content className={cn('fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-white rounded-2xl shadow-xl p-6', className)} aria-describedby={undefined}>
          {title && <Dialog.Title className="text-lg font-semibold mb-4">{title}</Dialog.Title>}
          <Dialog.Close className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-lg p-1" aria-label="Close"><X className="h-4 w-4" /></Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ---- Toast ----
type ToastType = 'success' | 'error' | 'info'
interface ToastItem { id: string; type: ToastType; title: string; description?: string }
interface ToastCtx { toast: (item: Omit<ToastItem, 'id'>) => void }
const ToastContext = React.createContext<ToastCtx | null>(null)
export function useToast() {
  const c = React.useContext(ToastContext)
  if (!c) throw new Error('useToast must be used within ToastProvider')
  return c
}
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])
  const toast = React.useCallback((item: Omit<ToastItem, 'id'>) =>
    setToasts(p => [...p, { ...item, id: crypto.randomUUID() }]), [])
  const remove = (id: string) => setToasts(p => p.filter(t => t.id !== id))
  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map(t => (
          <ToastPrimitive.Root key={t.id} open onOpenChange={v => !v && remove(t.id)} duration={4000}
            className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg max-w-sm w-full">
            <div className="flex-1">
              <ToastPrimitive.Title className="text-sm font-medium">{t.title}</ToastPrimitive.Title>
              {t.description && <ToastPrimitive.Description className="text-xs text-gray-500 mt-0.5">{t.description}</ToastPrimitive.Description>}
            </div>
            <ToastPrimitive.Close onClick={() => remove(t.id)}><X className="h-4 w-4 text-gray-400" /></ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

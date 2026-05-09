import React, { createContext, useContext, useState, useCallback, forwardRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Toast from '@radix-ui/react-toast'
import * as Select from '@radix-ui/react-select'
import * as Tabs from '@radix-ui/react-tabs'
import * as Tooltip from '@radix-ui/react-tooltip'
import { ChevronDown, X, Eye, EyeOff, AlertTriangle, Check, Info, CheckCircle, XCircle, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50'
    const variants = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-300',
      ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-300',
      destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
      outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300',
    }
    const sizes = { sm: 'h-7 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-10 px-5 text-sm', icon: 'h-8 w-8' }
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading && <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
    <input ref={ref} className={cn('h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow', error ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-slate-300', className)} {...props} />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </div>
))
Input.displayName = 'Input'

// ── PasswordInput ─────────────────────────────────────────────────────────────
interface PasswordInputProps extends Omit<InputProps, 'type'> {}
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(({ label, error, className, ...props }, ref) => {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <div className="relative">
        <input ref={ref} type={show ? 'text' : 'password'} className={cn('h-9 w-full rounded-lg border px-3 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-shadow', error ? 'border-red-400 focus:ring-red-300' : 'border-slate-200 focus:ring-slate-300', className)} {...props} />
        <button type="button" onClick={() => setShow(s => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-slate-100 rounded', className)} />
}

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral'
export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: BadgeVariant; className?: string }) {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    destructive: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
    neutral: 'bg-gray-100 text-gray-500',
  }
  return <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    active: 'success', confirmed: 'success', completed: 'success',
    pending: 'warning', pending_approval: 'warning', in_progress: 'info',
    inactive: 'neutral', cancelled: 'destructive', no_show: 'destructive',
    suspended: 'destructive', rejected: 'destructive',
  }
  return <Badge variant={map[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = {
    super_admin: 'destructive', owner: 'info', barber: 'success', customer: 'default',
  }
  return <Badge variant={map[role] ?? 'neutral'}>{role.replace(/_/g, ' ')}</Badge>
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
export function Modal({ open, onClose, title, description, children, size = 'md' }: ModalProps) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className={cn('fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full bg-white rounded-xl shadow-xl p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', widths[size])}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-base font-semibold text-slate-900">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-sm text-slate-500 mt-0.5">{description}</Dialog.Description>}
            </div>
            <Dialog.Close asChild><button className="text-slate-400 hover:text-slate-600 ml-4"><X className="h-4 w-4" /></button></Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
interface ConfirmModalProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; loading?: boolean; destructive?: boolean }
export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', loading, destructive }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <AlertTriangle className={cn('h-5 w-5 flex-shrink-0 mt-0.5', destructive ? 'text-red-500' : 'text-amber-500')} />
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant={destructive ? 'destructive' : 'primary'} size="sm" loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastItem { id: string; type: 'success' | 'error' | 'info'; title: string; description?: string }
interface ToastCtx { toast: (t: Omit<ToastItem, 'id'>) => void }
const ToastContext = createContext<ToastCtx>({ toast: () => {} })
export function useToast() { return useContext(ToastContext) }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    setToasts(prev => [...prev, { ...t, id: crypto.randomUUID() }])
  }, [])
  const icons = { success: <CheckCircle className="h-4 w-4 text-emerald-500" />, error: <XCircle className="h-4 w-4 text-red-500" />, info: <Info className="h-4 w-4 text-blue-500" /> }
  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map(t => (
          <Toast.Root key={t.id} onOpenChange={open => { if (!open) setToasts(prev => prev.filter(x => x.id !== t.id)) }}
            className="bg-white border border-slate-200 rounded-lg shadow-md p-3 flex items-start gap-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=swipe-end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full min-w-[280px]">
            {icons[t.type]}
            <div className="flex-1"><Toast.Title className="text-sm font-medium text-slate-900">{t.title}</Toast.Title>{t.description && <Toast.Description className="text-xs text-slate-500">{t.description}</Toast.Description>}</div>
            <Toast.Close className="text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-xs" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectOption { value: string; label: string }
interface SelectProps { value: string; onValueChange: (v: string) => void; options: SelectOption[]; placeholder?: string; label?: string; className?: string }
export function SelectInput({ value, onValueChange, options, placeholder = 'Select…', label, className }: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label className="text-xs font-medium text-slate-600">{label}</label>}
      <Select.Root value={value} onValueChange={onValueChange}>
        <Select.Trigger className="inline-flex items-center justify-between h-9 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 gap-1 min-w-[140px] bg-white">
          <Select.Value placeholder={placeholder} />
          <Select.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
            <Select.ScrollUpButton className="flex justify-center p-1"><ChevronUp className="h-4 w-4" /></Select.ScrollUpButton>
            <Select.Viewport className="p-1">
              {options.map(o => (
                <Select.Item key={o.value} value={o.value} className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-50 focus:bg-slate-50 outline-none">
                  <Select.ItemText>{o.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto"><Check className="h-3.5 w-3.5" /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex justify-center p-1"><ChevronDown className="h-4 w-4" /></Select.ScrollDownButton>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const TabsRoot = Tabs.Root
export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <Tabs.List className={cn('flex gap-1 border-b border-slate-200 mb-4', className)}>{children}</Tabs.List>
)
export const TabsTrigger = ({ value, children }: { value: string; children: React.ReactNode }) => (
  <Tabs.Trigger value={value} className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 data-[state=active]:text-slate-900 data-[state=active]:border-b-2 data-[state=active]:border-slate-900 -mb-px transition-colors">
    {children}
  </Tabs.Trigger>
)
export const TabsContent = Tabs.Content

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, loading }: { label: string; value: string | number; sub?: string; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {loading ? <><Skeleton className="h-7 w-20 mb-1" /><Skeleton className="h-3 w-28" /></> : (
        <>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
export function TooltipWrap({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children as React.ReactElement}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-slate-900 text-white text-xs px-2 py-1 rounded" sideOffset={4}>
            {tip}<Tooltip.Arrow className="fill-slate-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

// ── DangerZone ────────────────────────────────────────────────────────────────
export function DangerZone({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-red-200 p-4">
      <p className="text-sm font-semibold text-red-700 mb-3">Danger zone</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps { page: number; total: number; size: number; hasNext: boolean; onPage: (n: number) => void }
export function Pagination({ page, total, size, hasNext, onPage }: PaginationProps) {
  const totalPages = Math.ceil(total / size)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-3">
      <p className="text-xs text-slate-500">{total} total · page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ message = 'No results' }: { message?: string }) {
  return <p className="text-center text-sm text-slate-400 py-10">{message}</p>
}

// ── Code/JSON display ─────────────────────────────────────────────────────────
export function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono overflow-auto max-h-80 text-slate-700 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />,
  error: <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />,
  info: <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts(prev => [...prev, { ...item, id: crypto.randomUUID() }])
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            open
            onOpenChange={(open) => !open && remove(t.id)}
            duration={4000}
            className={cn(
              'flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg',
              'data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-in',
              'max-w-sm w-full',
            )}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="text-sm font-medium text-gray-900">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-gray-500 mt-0.5">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close aria-label="Dismiss" onClick={() => remove(t.id)}>
              <X className="h-4 w-4 text-gray-400" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-20 md:bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  )
}

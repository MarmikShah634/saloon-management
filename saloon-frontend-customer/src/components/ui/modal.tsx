import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-slide-up',
            className,
          )}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {title && (
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </Dialog.Title>
          )}
          {description && (
            <Dialog.Description id="modal-description" className="text-sm text-gray-500 mb-4">
              {description}
            </Dialog.Description>
          )}
          <Dialog.Close
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Bottom sheet (mobile-friendly)
export function BottomSheet({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl p-6 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto"
          aria-describedby={undefined}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />
          {title && (
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              {title}
            </Dialog.Title>
          )}
          <Dialog.Close
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 rounded-lg p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { Store, Users, Scissors, UserCheck, CalendarDays, BarChart2, ClipboardList, Bell, Plus, Search } from 'lucide-react'

interface CommandPaletteProps { open: boolean; onClose: () => void }

const NAV_ITEMS = [
  { label: 'Overview', to: '/', icon: BarChart2 },
  { label: 'Saloons', to: '/saloons', icon: Store },
  { label: 'New Saloon', to: '/saloons/new', icon: Plus },
  { label: 'Owners', to: '/owners', icon: Users },
  { label: 'New Owner', to: '/owners/new', icon: Plus },
  { label: 'Barbers', to: '/barbers', icon: Scissors },
  { label: 'Customers', to: '/customers', icon: UserCheck },
  { label: 'Bookings', to: '/bookings', icon: CalendarDays },
  { label: 'Audit Log', to: '/audit', icon: ClipboardList },
  { label: 'Analytics', to: '/analytics', icon: BarChart2 },
  { label: 'Notifications', to: '/notifications', icon: Bell },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  const go = useCallback((to: string) => { navigate(to); onClose(); setValue('') }, [navigate, onClose])

  useEffect(() => {
    if (!open) setValue('')
  }, [open])

  if (!open) return null
  return (
    <div>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
        <Command className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden" value={value} onValueChange={setValue}>
          <div className="flex items-center gap-2 border-b border-slate-200 px-3">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <Command.Input
              placeholder="Search or navigate…"
              className="flex-1 h-11 text-sm bg-transparent outline-none placeholder:text-slate-400"
              autoFocus
            />
            <kbd className="text-xs text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-1">
            <Command.Empty className="text-sm text-slate-400 text-center py-6">No results</Command.Empty>
            <Command.Group heading={<span className="text-xs font-medium text-slate-400 px-2">Navigate</span>}>
              {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                <Command.Item key={to} value={label} onSelect={() => go(to)}
                  className="flex items-center gap-2 px-2 py-2 text-sm rounded-lg cursor-pointer hover:bg-slate-50 data-[selected=true]:bg-slate-50 text-slate-700 transition-colors">
                  <Icon className="h-4 w-4 text-slate-400" />{label}
                  <span className="ml-auto text-xs text-slate-400 font-mono">{to}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(o => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])
  return { open, setOpen }
}

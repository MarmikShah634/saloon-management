export function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(v: string | number | undefined | null): string {
  if (v == null) return '—'
  const n = typeof v === 'string' ? parseFloat(v) : v
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export function shortId(id: string) {
  return id.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

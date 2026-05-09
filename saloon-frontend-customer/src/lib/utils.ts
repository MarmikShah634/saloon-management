import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  if (Number.isInteger(n)) return `₹${n}`
  return `₹${n.toFixed(2)}`
}

export function formatBookingDate(isoString: string, timezone?: string): string {
  const date = timezone ? toZonedTime(new Date(isoString), timezone) : new Date(isoString)
  return format(date, "EEE, d MMM · h:mm a")
}

export function formatDateShort(isoString: string): string {
  return format(new Date(isoString), 'd MMM yyyy')
}

export function formatTime(isoString: string, timezone?: string): string {
  const date = timezone ? toZonedTime(new Date(isoString), timezone) : new Date(isoString)
  return format(date, 'h:mm a')
}

export function timeAgo(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true })
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

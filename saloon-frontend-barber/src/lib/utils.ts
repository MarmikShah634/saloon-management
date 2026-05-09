import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatPrice(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`
}

export function formatTime(iso: string, tz?: string): string {
  const d = tz ? toZonedTime(new Date(iso), tz) : new Date(iso)
  return format(d, 'h:mm a')
}

export function formatDate(iso: string): string {
  return format(new Date(iso), 'EEE, d MMM yyyy')
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export function weekdayName(n: number): string { return WEEKDAYS[n] ?? '' }

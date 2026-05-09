import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
export function formatPrice(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`
}
export function formatDate(iso: string) { return format(new Date(iso), 'd MMM yyyy') }
export function formatDateTime(iso: string) { return format(new Date(iso), 'd MMM, h:mm a') }

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = 'INR') {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(typeof date === 'string' ? new Date(date) : date);
}

export function formatTime(time: string) {
  // Handles HH:MM:SS or HH:MM
  const parts = time.split(':');
  const d = new Date();
  d.setHours(Number(parts[0]), Number(parts[1] || 0), 0, 0);
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function spiceLabel(level: number) {
  if (level <= 0) return 'Mild';
  if (level === 1) return 'Mild+';
  if (level === 2) return 'Medium';
  if (level === 3) return 'Spicy';
  if (level === 4) return 'Hot';
  return 'Extra Hot';
}

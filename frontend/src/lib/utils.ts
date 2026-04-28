import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function getMonthName(month: number): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long' }).format(
    new Date(2024, month - 1, 1)
  );
}

export function getMonthShort(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(
    new Date(parseInt(year), parseInt(month) - 1, 1)
  );
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export const PAYMENT_MODES = [
  { value: 'upi', label: 'UPI', icon: '📲' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { value: 'other', label: 'Other', icon: '🔄' },
] as const;

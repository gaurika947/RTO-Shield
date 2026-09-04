import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getRiskColor(tier: string): string {
  switch (tier) {
    case 'LOW': return 'text-emerald-600';
    case 'MEDIUM': return 'text-amber-600';
    case 'HIGH': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function getRiskBg(tier: string): string {
  switch (tier) {
    case 'LOW': return 'bg-emerald-50 border-emerald-200';
    case 'MEDIUM': return 'bg-amber-50 border-amber-200';
    case 'HIGH': return 'bg-red-50 border-red-200';
    default: return 'bg-gray-50 border-gray-200';
  }
}

export function getRiskDot(tier: string): string {
  switch (tier) {
    case 'LOW': return 'bg-emerald-500';
    case 'MEDIUM': return 'bg-amber-500';
    case 'HIGH': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

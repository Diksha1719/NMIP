import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
export const date = (value: string) => new Date(value).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

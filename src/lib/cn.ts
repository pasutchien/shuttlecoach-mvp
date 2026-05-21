import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge conditional Tailwind class names, de-duplicating conflicts —
 * the same `cn` helper the react-native-reusables / shadcn ecosystem uses.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

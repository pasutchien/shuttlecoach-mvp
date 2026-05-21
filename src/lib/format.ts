/** Small formatting helpers shared across screens. */
import type { AppLocale } from '@/src/i18n';

/** Format an ISO date as a short, locale-aware label (e.g. "21 May 2026"). */
export function formatDate(iso: string, locale: AppLocale): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format an ISO date relative to today ("Today", "Yesterday") or a short date. */
export function formatRelativeDate(iso: string, locale: AppLocale): string {
  const d = new Date(iso);
  const now = new Date();
  const dayMs = 86_400_000;
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / dayMs);

  if (diffDays === 0) return locale === 'th' ? 'วันนี้' : 'Today';
  if (diffDays === 1) return locale === 'th' ? 'เมื่อวาน' : 'Yesterday';
  if (diffDays < 7)
    return locale === 'th' ? `${diffDays} วันที่แล้ว` : `${diffDays} days ago`;
  return formatDate(iso, locale);
}

/** Group-separated integer, e.g. 1200 → "1,200". */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** One-decimal seconds label, e.g. "4.2". */
export function formatSeconds(value: number): string {
  return value.toFixed(1);
}

/**
 * Design-system colors (SPEC §5.2).
 *
 * Mirrors `tailwind.config.js` for the cases where a raw value is unavoidable —
 * icon `color` props, chart series, Reanimated interpolations, native APIs.
 * For anything that renders JSX, prefer NativeWind classes (`bg-navy`, etc.).
 */
export const colors = {
  navy: '#0A1628',
  deepNavy: '#1A2236',
  primary: '#2563EB',
  mint: '#00C896',
  orange: '#E84A30',
  slate: '#64748B',
  light: '#F1F5F9',
  white: '#FFFFFF',
  scoreRed: '#EF4444',
  scoreAmber: '#F59E0B',
  scoreGreen: '#22C55E',
  border: '#CBD5E1',
  placeholder: '#94A3B8',
  ink: '#0F172A',
  inkSoft: '#475569',
  tipBg: '#EFF6FF',
  tipBorder: '#BFDBFE',
} as const;

export type ColorToken = keyof typeof colors;

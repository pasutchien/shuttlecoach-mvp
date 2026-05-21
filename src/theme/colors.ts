/**
 * Design-system colors (SPEC §5.2, refined to a premium spec).
 *
 * Mirrors `tailwind.config.js` for cases where a raw value is unavoidable —
 * icon `color` props, chart series, Reanimated interpolations, native APIs.
 * For anything that renders JSX, prefer NativeWind classes (`bg-navy`, etc.).
 */
export const colors = {
  // Core brand
  navy: '#0A1628', // App background, headers, splash
  deepNavy: '#1A2236', // Card surface on dark
  cardDark: '#1E2D45', // Elevated card surface on a navy background
  primary: '#2563EB', // Electric Blue — primary actions, links, active
  mint: '#00C896', // Neon Mint — AI / success
  mintStrong: '#00A87E', // Mint, darkened for text on white
  orange: '#E84A30', // Fire Orange — the single primary CTA + sponsor

  // Surfaces
  slate: '#64748B', // Secondary text / icons
  light: '#F1F5F9', // Light-mode screen background
  lightAlt: '#F8FAFC', // Slightly cooler alternate surface
  white: '#FFFFFF',

  // Score / status
  scoreRed: '#EF4444',
  scoreAmber: '#F59E0B',
  scoreGreen: '#22C55E',

  // Text
  ink: '#0F172A', // Primary text
  inkSoft: '#475569', // Secondary text — WCAG-AA safe on white
  inkMuted: '#94A3B8', // Tertiary text / placeholders
  onDark: '#FFFFFF', // Primary text on navy
  onDarkMuted: 'rgba(255,255,255,0.72)', // Secondary text on navy
  onDarkFaint: 'rgba(255,255,255,0.42)', // Tertiary text on navy

  // Borders
  border: '#CBD5E1', // Hairline borders, disabled button bg
  borderSoft: 'rgba(203,213,225,0.6)', // Card hairline (barely visible)
  borderDark: 'rgba(255,255,255,0.08)', // Inner top-edge highlight on dark cards
  placeholder: '#94A3B8',

  // Accent tints (10–12% — for soft accent surfaces)
  tipBg: '#EFF6FF', // Coaching tip card background
  tipBorder: '#BFDBFE',
  primaryTint: 'rgba(37,99,235,0.12)',
  orangeTint: 'rgba(232,74,48,0.12)',
  mintTint: 'rgba(0,200,150,0.12)',
} as const;

export type ColorToken = keyof typeof colors;

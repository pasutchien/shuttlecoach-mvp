/**
 * Spacing, radii and sizing tokens (SPEC §5.4). Everything sits on an 8pt grid.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  screenX: 20, // Screen horizontal padding
  card: 16, // Card internal padding
  section: 24, // Gap between major zones
} as const;

export const radii = {
  input: 8,
  chip: 8,
  card: 12,
  button: 12,
  sheet: 20,
  pill: 999,
} as const;

export const sizing = {
  primaryButton: 56, // Full-width primary button height
  secondaryButton: 48,
  iconButton: 44, // Minimum touch target
  tabBar: 83, // iPhone tab bar incl. safe area
  touchTarget: 44,
  // Shared AppHeader content-row height (excludes the safe-area top inset).
  // Every screen header is exactly `safeAreaTop + header` tall — see AppHeader.
  header: 56,
} as const;

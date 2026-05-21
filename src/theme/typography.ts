/**
 * Typography tokens.
 *
 * The app uses a single, clean variable sans-serif — **Inter** — across the
 * whole UI (the standard modern app typeface). Weight, not a separate display
 * face, carries hierarchy. Font keys match the `@expo-google-fonts/inter`
 * exports and the `fontFamily` map in `tailwind.config.js`.
 */
export const fonts = {
  display: 'Inter_700Bold', // Hero headlines, score numbers
  headingBold: 'Inter_600SemiBold', // Section headers, card titles
  label: 'Inter_500Medium', // Buttons, tabs, form labels
  body: 'Inter_400Regular', // Body, descriptions, tips
  bodyMedium: 'Inter_500Medium',
  mono: 'Inter_500Medium', // Credits, numeric data (Inter, tabular-friendly)
} as const;

/** Role-based type scale, in points (4/8-pt rhythm). */
export const fontSizes = {
  hero: 28,
  display: 24,
  h1: 22,
  h2: 18,
  label: 15,
  body: 14,
  caption: 12,
  data: 13,
} as const;

/**
 * Typography tokens (SPEC §5.3). Font family constants match the keys used by
 * `@expo-google-fonts/*` and the `fontFamily` map in `tailwind.config.js`.
 */
export const fonts = {
  display: 'Syne_800ExtraBold', // Hero headlines, score numbers
  headingBold: 'SpaceGrotesk_600SemiBold', // Section headers, card titles
  label: 'SpaceGrotesk_500Medium', // Buttons, tabs, form labels
  body: 'DMSans_400Regular', // Body, descriptions, tips
  bodyMedium: 'DMSans_500Medium',
  mono: 'DMMono_400Regular', // Credits, technical values
} as const;

/** Role-based type scale, in points. */
export const fontSizes = {
  hero: 32,
  display: 28,
  h1: 24,
  h2: 20,
  label: 15,
  body: 14,
  caption: 12,
  data: 13,
} as const;

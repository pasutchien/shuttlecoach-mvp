/**
 * Tailwind config — the single source of truth for design tokens (SPEC §5.2–5.4).
 * NativeWind utility classes (bg-navy, text-primary, rounded-card, font-display…)
 * map directly to these values. Never hard-code a hex in a component.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Core palette
        navy: '#0A1628', // Primary background, headers, splash
        'deep-navy': '#1A2236', // Card surfaces on dark backgrounds
        primary: '#2563EB', // Electric Blue — primary buttons, links, active
        mint: '#00C896', // Neon Mint — AI elements, success
        orange: '#E84A30', // Fire Orange — main CTA, sponsor badge
        slate: '#64748B', // Secondary text
        light: '#F1F5F9', // Light-mode screen background
        white: '#FFFFFF', // Surfaces — cards, modals, sheets

        // Score / status
        'score-red': '#EF4444',
        'score-amber': '#F59E0B',
        'score-green': '#22C55E',

        // Supporting greys
        border: '#CBD5E1', // Hairline borders, disabled button bg
        placeholder: '#94A3B8', // Placeholder + disabled text
        ink: '#0F172A', // Near-black text / toast background
        'ink-soft': '#475569', // Secondary text — WCAG-AA safe on white
        'tip-bg': '#EFF6FF', // Coaching tip card background
        'tip-border': '#BFDBFE', // Coaching tip card border
      },
      fontFamily: {
        // Single typeface — Inter — across the whole app. Weight carries
        // hierarchy. Class names are unchanged so components need no edits.
        display: ['Inter_700Bold'], // Hero headlines, score numbers
        'heading-bold': ['Inter_600SemiBold'], // Section headers, card titles
        label: ['Inter_500Medium'], // Buttons, tabs, form labels
        body: ['Inter_400Regular'], // Body, descriptions, tips
        'body-medium': ['Inter_500Medium'],
        mono: ['Inter_500Medium'], // Credits, numeric data
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        chip: '8px',
        sheet: '20px',
      },
      spacing: {
        // 8pt grid helpers (in addition to Tailwind defaults)
        screen: '20px', // Screen horizontal padding
        card: '16px', // Card internal padding
        section: '24px', // Gap between major zones
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

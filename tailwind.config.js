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
        'card-dark': '#1E2D45', // Elevated card on a navy background
        primary: '#2563EB', // Electric Blue — primary buttons, links, active
        mint: '#00C896', // Neon Mint — AI elements, success
        'mint-strong': '#00A87E', // Mint, darkened for text on white
        orange: '#E84A30', // Fire Orange — the single primary CTA + sponsor
        slate: '#64748B', // Secondary text
        light: '#F1F5F9', // Light-mode screen background
        'light-alt': '#F8FAFC', // Cooler alternate surface
        white: '#FFFFFF', // Surfaces — cards, modals, sheets

        // Score / status
        'score-red': '#EF4444',
        'score-amber': '#F59E0B',
        'score-green': '#22C55E',

        // Deep tones — legible text on a tinted (12%) badge background
        'primary-deep': '#1D4ED8',
        'green-deep': '#15803D',
        'amber-deep': '#B45309',
        'red-deep': '#B91C1C',

        // Supporting greys
        border: '#CBD5E1', // Hairline borders, disabled button bg
        'border-soft': 'rgba(203,213,225,0.6)', // Card hairline
        placeholder: '#94A3B8', // Placeholder + disabled text
        ink: '#0F172A', // Near-black text / toast background
        'ink-soft': '#475569', // Secondary text — WCAG-AA safe on white
        'ink-muted': '#94A3B8', // Tertiary text
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
        xs: '4px',
        input: '10px', // Inputs, small surfaces
        card: '12px', // Content cards, secondary buttons
        'card-lg': '16px', // Feature cards (packages)
        button: '14px', // Primary CTA
        chip: '20px', // Filter chips — pill-like
        sheet: '24px', // Bottom sheet top corners
      },
      spacing: {
        // 8pt grid helpers (in addition to Tailwind defaults)
        screen: '20px', // Screen horizontal padding
        card: '16px', // Card internal padding
        section: '24px', // Gap between major zones
      },
      boxShadow: {
        // Navy-tinted elevation scale (see src/theme/shadows.ts for the
        // native style objects components actually use).
        card: '0 1px 4px rgba(10,22,40,0.07)',
        'card-raised': '0 4px 12px rgba(10,22,40,0.10)',
        sheet: '0 -4px 20px rgba(10,22,40,0.12)',
        modal: '0 8px 32px rgba(10,22,40,0.16)',
      },
    },
  },
  plugins: [],
};

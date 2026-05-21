/**
 * Elevation system — a 4-level shadow scale (plus coloured "float" shadows).
 *
 * Premium detail: shadows are tinted with the brand navy (#0A1628), never pure
 * black — pure-black shadows read as a dirty grey halo. Opacity stays restrained
 * (7–16%). Use these style objects directly via the `style` prop (reliable on
 * both platforms) rather than NativeWind shadow classes.
 */
import type { ViewStyle } from 'react-native';

const SHADOW_TINT = '#0A1628';

export const shadows = {
  none: {} as ViewStyle,

  /** Level 1 — resting white cards on a light background. */
  cardResting: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  /** Level 2 — raised / interactive cards, dropdowns. */
  cardRaised: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,

  /** Level 3 — bottom sheets (shadow spreads upward). */
  sheet: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  } as ViewStyle,

  /** Level 4 — modals / dialogs / toasts. */
  modal: {
    shadowColor: SHADOW_TINT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 16,
  } as ViewStyle,

  /** Coloured lift for a blue primary button. */
  floatBlue: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  } as ViewStyle,

  /** Coloured lift for the orange CTA. */
  floatOrange: {
    shadowColor: '#E84A30',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  } as ViewStyle,
} as const;

export type ShadowToken = keyof typeof shadows;

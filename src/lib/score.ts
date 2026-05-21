/**
 * Score helpers (SPEC §8.2).
 *
 * Two distinct mappings, deliberately:
 *  - `scoreColorToken` — the 3-band colour used by score circles, badges and
 *    cards (green ≥80, amber 50–79, red <50) per S3 / S9.
 *  - `scoreBand` — the 4-band qualitative label from the §8.2 results table.
 */
import { colors } from '@/src/theme';

export type ScoreColorToken = 'score-green' | 'score-amber' | 'score-red';

/** NativeWind colour token for a score circle / badge / card. */
export function scoreColorToken(score: number): ScoreColorToken {
  if (score >= 80) return 'score-green';
  if (score >= 50) return 'score-amber';
  return 'score-red';
}

/** Raw hex for a score, for SVG / chart / Reanimated use. */
export function scoreColorHex(score: number): string {
  if (score >= 80) return colors.scoreGreen;
  if (score >= 50) return colors.scoreAmber;
  return colors.scoreRed;
}

export interface ScoreBand {
  /** i18n key under `analysis.*`. */
  labelKey: string;
  hex: string;
}

/** Qualitative band for the overall score (SPEC §8.2). */
export function scoreBand(score: number): ScoreBand {
  if (score >= 80)
    return { labelKey: 'analysis.scoreExcellent', hex: colors.scoreGreen };
  if (score >= 60)
    return { labelKey: 'analysis.scoreGood', hex: colors.primary };
  if (score >= 40)
    return { labelKey: 'analysis.scoreDeveloping', hex: colors.scoreAmber };
  return { labelKey: 'analysis.scoreNeedsWork', hex: colors.scoreRed };
}

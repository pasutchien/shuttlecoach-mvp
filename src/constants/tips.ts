/** Coaching tips — Home "Tip of the Day" and the S8 rotating tips. */
import type { CoachingTip, StrokeType } from '@/src/types';

/** General tips, rotated every 8s on the S8 processing screen (SPEC §4 S8). */
export const PROCESSING_TIPS: CoachingTip[] = [
  { id: 'tip-1', textKey: 'processing.tip1' },
  { id: 'tip-2', textKey: 'processing.tip2' },
  { id: 'tip-3', textKey: 'processing.tip3' },
  { id: 'tip-4', textKey: 'processing.tip4' },
  { id: 'tip-5', textKey: 'processing.tip5' },
];

/** One stroke-specific tip per stroke (shown first while that stroke processes). */
const STROKE_TIP_KEY: Record<StrokeType, string> = {
  Smash: 'processing.strokeTip.Smash',
  Drop_Shot: 'processing.strokeTip.Drop_Shot',
  Clear: 'processing.strokeTip.Clear',
  Drive: 'processing.strokeTip.Drive',
  Net_Kill: 'processing.strokeTip.Net_Kill',
};

/**
 * Tips to rotate while a given stroke is being analysed: the stroke-specific
 * tip first, then the general pool — so the wait feels personalised.
 */
export function tipsForStroke(stroke: StrokeType | null): CoachingTip[] {
  if (!stroke) return PROCESSING_TIPS;
  return [
    { id: `stroke-${stroke}`, textKey: STROKE_TIP_KEY[stroke] },
    ...PROCESSING_TIPS,
  ];
}

/**
 * Tip of the Day — deterministically chosen from the general tips by the day
 * of the year, so it is stable for a given day but rotates over time.
 */
export function tipOfTheDay(): CoachingTip {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return PROCESSING_TIPS[dayOfYear % PROCESSING_TIPS.length];
}

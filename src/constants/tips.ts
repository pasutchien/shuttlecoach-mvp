/** Coaching tips — Home "Tip of the Day" and the S8 rotating tips. */
import type { CoachingTip } from '@/src/types';

/** Five tips rotated every 8s on the S8 processing screen (SPEC §4 S8). */
export const PROCESSING_TIPS: CoachingTip[] = [
  { id: 'tip-1', textKey: 'processing.tip1' },
  { id: 'tip-2', textKey: 'processing.tip2' },
  { id: 'tip-3', textKey: 'processing.tip3' },
  { id: 'tip-4', textKey: 'processing.tip4' },
  { id: 'tip-5', textKey: 'processing.tip5' },
];

/**
 * Tip of the Day — deterministically chosen from the processing tips by the
 * day of the year so it is stable for a given day but rotates over time.
 */
export function tipOfTheDay(): CoachingTip {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return PROCESSING_TIPS[dayOfYear % PROCESSING_TIPS.length];
}

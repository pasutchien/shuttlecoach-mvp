/**
 * Per-stroke checkpoint weighting (SPEC §8.1–§8.2). The overall score is a
 * weighted average of the seven checkpoint sub-scores; weights vary by stroke
 * (e.g. Contact Point Height counts for more on a Smash than a Drop Shot).
 */
import type { CheckpointKey, StrokeType } from '@/src/types';

type WeightMap = Record<CheckpointKey, number>;

export const CHECKPOINT_WEIGHTS: Record<StrokeType, WeightMap> = {
  Smash: {
    grip: 0.1,
    stance: 0.15,
    backswing: 0.15,
    elbow: 0.15,
    contact: 0.2,
    weight: 0.15,
    follow_through: 0.1,
  },
  Drop_Shot: {
    grip: 0.15,
    stance: 0.15,
    backswing: 0.1,
    elbow: 0.15,
    contact: 0.15,
    weight: 0.1,
    follow_through: 0.2,
  },
  Clear: {
    grip: 0.1,
    stance: 0.15,
    backswing: 0.2,
    elbow: 0.15,
    contact: 0.15,
    weight: 0.15,
    follow_through: 0.1,
  },
  Drive: {
    grip: 0.2,
    stance: 0.15,
    backswing: 0.1,
    elbow: 0.15,
    contact: 0.15,
    weight: 0.15,
    follow_through: 0.1,
  },
  Net_Kill: {
    grip: 0.2,
    stance: 0.15,
    backswing: 0.1,
    elbow: 0.2,
    contact: 0.15,
    weight: 0.1,
    follow_through: 0.1,
  },
};

/** Weighted overall score, 0–100 (SPEC §8.2). */
export function weightedOverall(
  stroke: StrokeType,
  checkpoints: { key: CheckpointKey; score: number }[],
): number {
  const weights = CHECKPOINT_WEIGHTS[stroke];
  const total = checkpoints.reduce(
    (sum, c) => sum + c.score * weights[c.key],
    0,
  );
  return Math.round(total);
}

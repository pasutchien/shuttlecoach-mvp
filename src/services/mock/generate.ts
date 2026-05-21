/**
 * Deterministic-ish generators that turn a stroke + request into a realistic
 * Analysis. Used both to seed fixture history and to produce live mock job
 * results, so seeded and freshly-generated analyses look identical.
 */
import { CHECKPOINT_KEYS } from '@/src/types';
import type {
  Analysis,
  CheckpointKey,
  CheckpointScore,
  MistakeCard,
  Severity,
  StrokeType,
} from '@/src/types';
import { weightedOverall } from '@/src/constants/strokes';

/** Plain-language mistake copy per checkpoint (SPEC §8.3 — this is AI content). */
const MISTAKE_TEMPLATES: Record<
  CheckpointKey,
  { title: string; description: string; drillId: string }
> = {
  grip: {
    title: 'Tense Grip Through Swing',
    description:
      'Your grip stayed tight during the backswing, which slows racket-head speed and costs you power.',
    drillId: 'drill-grip',
  },
  stance: {
    title: 'Limited Shoulder Rotation',
    description:
      'Your shoulders rotated less than the optimal range, leaving power on the table before contact.',
    drillId: 'drill-stance',
  },
  backswing: {
    title: 'Backswing Cut Short',
    description:
      'Your racket arm was pulled back about 20° less than optimal, reducing the energy stored for the shot.',
    drillId: 'drill-backswing',
  },
  elbow: {
    title: 'Low Elbow Position',
    description:
      'Your elbow dropped below shoulder height mid-swing, limiting the whip you can generate.',
    drillId: 'drill-elbow-lead',
  },
  contact: {
    title: 'Contact Point Too Low',
    description:
      'Your racket met the shuttle around 15 cm below the optimal contact zone, reducing power and control.',
    drillId: 'drill-contact-point',
  },
  weight: {
    title: 'Weak Weight Transfer',
    description:
      'Your weight stayed on the back foot through contact, so your legs added little power to the shot.',
    drillId: 'drill-weight-transfer',
  },
  follow_through: {
    title: 'Follow-Through Cut Short',
    description:
      'Your swing braked soon after contact, which reduces both shot power and consistency.',
    drillId: 'drill-follow-through',
  },
};

/** Severity from a checkpoint sub-score (SPEC §8.3). */
function severityFor(score: number): Severity {
  if (score < 42) return 'Critical';
  if (score < 60) return 'Major';
  return 'Minor';
}

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  Major: 1,
  Minor: 2,
};

/** A tiny seeded PRNG so a given seed always yields the same analysis. */
function makeRng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generate seven checkpoint sub-scores around a target overall band.
 * `seed` keeps a given analysis stable across reloads.
 */
export function generateCheckpoints(
  targetBand: number,
  seed: number,
): CheckpointScore[] {
  const rng = makeRng(seed);
  return CHECKPOINT_KEYS.map((key) => {
    const spread = 26;
    const raw = targetBand + (rng() - 0.5) * spread;
    return { key, score: Math.max(18, Math.min(99, Math.round(raw))) };
  });
}

/**
 * Build up to 5 Mistake Cards from the weakest checkpoints, sorted
 * Critical → Major → Minor (SPEC §8.3).
 */
export function mistakesFromCheckpoints(
  checkpoints: CheckpointScore[],
  durationSec: number,
  seed: number,
): MistakeCard[] {
  const rng = makeRng(seed + 99);
  const weak = [...checkpoints]
    .filter((c) => c.score < 78)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);

  const cards: MistakeCard[] = weak.map((c, i) => {
    const tpl = MISTAKE_TEMPLATES[c.key];
    return {
      id: `mistake-${seed}-${i}`,
      title: tpl.title,
      description: tpl.description,
      severity: severityFor(c.score),
      // Spread mistake timestamps across the clip.
      timestampSec: Number(
        (0.15 * durationSec + rng() * 0.7 * durationSec).toFixed(1),
      ),
      drillId: tpl.drillId,
    };
  });

  return cards.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
}

/**
 * Assemble a complete Analysis. `seed` derives all randomised values, so the
 * same inputs always produce the same result.
 */
export function buildAnalysis(params: {
  id: string;
  jobId: string;
  createdAt: string;
  strokeType: StrokeType;
  proPlayerId: string;
  durationSec: number;
  targetBand: number;
  seed: number;
}): Analysis {
  const checkpoints = generateCheckpoints(params.targetBand, params.seed);
  const overallScore = weightedOverall(params.strokeType, checkpoints);
  return {
    id: params.id,
    jobId: params.jobId,
    createdAt: params.createdAt,
    strokeType: params.strokeType,
    overallScore,
    checkpoints,
    proPlayerId: params.proPlayerId,
    userVideoUrl: 'sample://user',
    proVideoUrl: 'sample://pro',
    mistakes: mistakesFromCheckpoints(
      checkpoints,
      params.durationSec,
      params.seed,
    ),
    durationSec: params.durationSec,
  };
}

/**
 * Seed fixtures for the mock backend.
 *
 * `seedFull()` returns a realistic returning-user state (profile + 8 past
 * analyses + ledger) so Home, History and progress deltas are populated.
 * `seedEmpty()` returns a brand-new-user state for demoing onboarding and the
 * empty states (SPEC §6.1). Which one is used is controlled by
 * `EXPO_PUBLIC_SEED` (see `src/services/mock/db.ts`).
 */
import type { Analysis, Transaction, UserProfile } from '@/src/types';
import { buildAnalysis } from './generate';

/**
 * Persisted mock-DB schema version. Bump this whenever the `MockDb` shape
 * changes — a persisted DB with a different version is discarded and re-seeded
 * rather than loaded structurally-stale.
 */
export const SCHEMA_VERSION = 1;

export interface MockDb {
  /** Schema version of the persisted blob (see `SCHEMA_VERSION`). */
  schemaVersion: number;
  /** `null` until the user completes onboarding. */
  profile: UserProfile | null;
  credits: number;
  /** Newest first. */
  transactions: Transaction[];
  /** Newest first. */
  analyses: Analysis[];
}

const SEED_PROFILE: UserProfile = {
  id: 'user-1',
  fullName: 'Somchai Jaidee',
  displayName: 'Somchai',
  heightCm: 175,
  weightKg: 70,
  favoriteProId: 'PRO_001',
  playStyle: 'Singles',
  experienceLevel: 'Intermediate',
  goals: ['Improve_Smash', 'Consistency'],
  notifications: { analysisComplete: true, weeklySummary: true },
  hasCompletedFirstAnalysis: true,
};

/** Definitions for the 8 seeded analyses (oldest → newest). */
const SEED_ANALYSES_SPEC = [
  { date: '2026-04-08T18:20:00Z', stroke: 'Smash', pro: 'PRO_001', dur: 4.2, band: 52 },
  { date: '2026-04-15T19:05:00Z', stroke: 'Clear', pro: 'PRO_001', dur: 5.1, band: 61 },
  { date: '2026-04-22T18:40:00Z', stroke: 'Drop_Shot', pro: 'PRO_001', dur: 3.8, band: 58 },
  { date: '2026-04-29T20:10:00Z', stroke: 'Smash', pro: 'PRO_001', dur: 4.6, band: 64 },
  { date: '2026-05-05T18:55:00Z', stroke: 'Drive', pro: 'PRO_002', dur: 3.2, band: 70 },
  { date: '2026-05-11T19:30:00Z', stroke: 'Net_Kill', pro: 'PRO_002', dur: 2.9, band: 66 },
  { date: '2026-05-16T17:45:00Z', stroke: 'Clear', pro: 'PRO_001', dur: 4.9, band: 73 },
  { date: '2026-05-19T20:00:00Z', stroke: 'Smash', pro: 'PRO_001', dur: 4.4, band: 77 },
] as const;

function buildSeedAnalyses(): Analysis[] {
  const list = SEED_ANALYSES_SPEC.map((s, i) =>
    buildAnalysis({
      id: `seed-analysis-${i + 1}`,
      jobId: `seed-job-${i + 1}`,
      createdAt: s.date,
      strokeType: s.stroke,
      proPlayerId: s.pro,
      durationSec: s.dur,
      targetBand: s.band,
      seed: 1000 + i * 37,
    }),
  );
  // Stored newest first.
  return list.reverse();
}

/** Ledger consistent with the seeded analyses; ends at a 300-credit balance. */
const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', date: '2026-04-05T10:00:00Z', type: 'purchase', credits: 100, label: 'Welcome Gift', balanceAfter: 100 },
  { id: 'tx-2', date: '2026-04-07T11:30:00Z', type: 'purchase', credits: 500, label: 'Practice Pack', balanceAfter: 600 },
  { id: 'tx-3', date: '2026-04-08T18:20:00Z', type: 'analysis', credits: -100, label: 'Smash Analysis', balanceAfter: 500 },
  { id: 'tx-4', date: '2026-04-15T19:05:00Z', type: 'analysis', credits: -100, label: 'Clear Analysis', balanceAfter: 400 },
  { id: 'tx-5', date: '2026-04-22T18:40:00Z', type: 'analysis', credits: -100, label: 'Drop Shot Analysis', balanceAfter: 300 },
  { id: 'tx-6', date: '2026-04-29T20:10:00Z', type: 'analysis', credits: -100, label: 'Smash Analysis', balanceAfter: 200 },
  { id: 'tx-7', date: '2026-05-03T09:15:00Z', type: 'purchase', credits: 500, label: 'Practice Pack', balanceAfter: 700 },
  { id: 'tx-8', date: '2026-05-05T18:55:00Z', type: 'analysis', credits: -100, label: 'Drive Analysis', balanceAfter: 600 },
  { id: 'tx-9', date: '2026-05-11T19:30:00Z', type: 'analysis', credits: -100, label: 'Net Kill Analysis', balanceAfter: 500 },
  { id: 'tx-10', date: '2026-05-16T17:45:00Z', type: 'analysis', credits: -100, label: 'Clear Analysis', balanceAfter: 400 },
  { id: 'tx-11', date: '2026-05-19T20:00:00Z', type: 'analysis', credits: -100, label: 'Smash Analysis', balanceAfter: 300 },
];

/** Returning-user seed: full profile, history and ledger. */
export function seedFull(): MockDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: { ...SEED_PROFILE },
    credits: 300,
    transactions: [...SEED_TRANSACTIONS].reverse(), // newest first
    analyses: buildSeedAnalyses(),
  };
}

/** Brand-new-user seed: no profile, no credits, no history. */
export function seedEmpty(): MockDb {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: null,
    credits: 0,
    transactions: [],
    analyses: [],
  };
}

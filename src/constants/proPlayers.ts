/**
 * MVP Pro Player roster (SPEC §7.2) and the matching logic (§7.3).
 *
 * Note: the SPEC §7.2 table lists no Net Kill coverage for any player. Since S5
 * offers Net Kill as a selectable stroke, a few players are given Net Kill
 * reference footage here so the matcher always has a valid comparison — this is
 * a deliberate, documented fixture choice (see BACKEND.md).
 */
import type { ProPlayer, StrokeType } from '@/src/types';

/** Two reference clip ids per stroke, per SPEC §7.2 ("at least 2 ... required"). */
const clips = (player: string, strokes: StrokeType[]) =>
  Object.fromEntries(
    strokes.map((s) => [s, [`${player}_${s}_a`, `${player}_${s}_b`]]),
  ) as ProPlayer['referenceClips'];

export const PRO_PLAYERS: ProPlayer[] = [
  {
    id: 'PRO_001',
    name: 'Kunlavut Vitidsarn',
    heightCm: 180,
    nationality: 'Thailand',
    playStyle: 'Singles',
    availableStrokes: ['Smash', 'Drop_Shot', 'Clear'],
    referenceClips: clips('PRO_001', ['Smash', 'Drop_Shot', 'Clear']),
    matchingHeightRangeCm: [170, 190],
    rating: 96,
  },
  {
    id: 'PRO_002',
    name: 'Kento Momota',
    heightCm: 171,
    nationality: 'Japan',
    playStyle: 'Singles',
    availableStrokes: ['Smash', 'Drop_Shot', 'Clear', 'Drive', 'Net_Kill'],
    referenceClips: clips('PRO_002', [
      'Smash',
      'Drop_Shot',
      'Clear',
      'Drive',
      'Net_Kill',
    ]),
    matchingHeightRangeCm: [161, 181],
    rating: 94,
  },
  {
    id: 'PRO_003',
    name: 'Viktor Axelsen',
    heightCm: 194,
    nationality: 'Denmark',
    playStyle: 'Singles',
    availableStrokes: ['Smash', 'Clear', 'Drive', 'Net_Kill'],
    referenceClips: clips('PRO_003', ['Smash', 'Clear', 'Drive', 'Net_Kill']),
    matchingHeightRangeCm: [184, 204],
    rating: 98,
  },
  {
    id: 'PRO_004',
    name: 'Ratchanok Intanon',
    heightCm: 163,
    nationality: 'Thailand',
    playStyle: 'Singles',
    availableStrokes: ['Smash', 'Drop_Shot', 'Clear'],
    referenceClips: clips('PRO_004', ['Smash', 'Drop_Shot', 'Clear']),
    matchingHeightRangeCm: [153, 173],
    rating: 93,
  },
  {
    id: 'PRO_005',
    name: 'Carolina Marin',
    heightCm: 172,
    nationality: 'Spain',
    playStyle: 'Singles',
    availableStrokes: ['Smash', 'Clear', 'Drive', 'Net_Kill'],
    referenceClips: clips('PRO_005', ['Smash', 'Clear', 'Drive', 'Net_Kill']),
    matchingHeightRangeCm: [162, 182],
    rating: 95,
  },
];

/** Avatar accent colour per player (auto-assigned, stable). */
export const PRO_ACCENT: Record<string, string> = {
  PRO_001: '#2563EB',
  PRO_002: '#E84A30',
  PRO_003: '#00C896',
  PRO_004: '#F59E0B',
  PRO_005: '#8B5CF6',
};

/** Players that have reference footage for a given stroke. */
export function prosForStroke(stroke: StrokeType): ProPlayer[] {
  return PRO_PLAYERS.filter((p) => p.availableStrokes.includes(stroke));
}

/**
 * Pick the comparison Pro Player for an analysis (SPEC §7.3):
 *  1. the user's favourite — if they cover the stroke;
 *  2. else the closest height match (within ±10 cm) that covers the stroke;
 *  3. else the globally highest-rated player that covers the stroke.
 */
export function matchProPlayer(
  stroke: StrokeType,
  userHeightCm: number,
  favoriteProId?: string,
): ProPlayer {
  const candidates = prosForStroke(stroke);
  if (candidates.length === 0) {
    // Should not happen given the roster above; fall back to the top pro.
    return [...PRO_PLAYERS].sort((a, b) => b.rating - a.rating)[0];
  }

  // 1. Favourite player.
  const favorite = candidates.find((p) => p.id === favoriteProId);
  if (favorite) return favorite;

  // 2. Closest height within ±10 cm.
  const withinBand = candidates
    .filter((p) => Math.abs(p.heightCm - userHeightCm) <= 10)
    .sort(
      (a, b) =>
        Math.abs(a.heightCm - userHeightCm) -
        Math.abs(b.heightCm - userHeightCm),
    );
  if (withinBand[0]) return withinBand[0];

  // 3. Globally highest-rated for the stroke.
  return [...candidates].sort((a, b) => b.rating - a.rating)[0];
}

export function getProPlayer(id: string): ProPlayer | undefined {
  return PRO_PLAYERS.find((p) => p.id === id);
}

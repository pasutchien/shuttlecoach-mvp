/**
 * Achievement derivation (SPEC §10 — gamification).
 *
 * Badges are computed purely from local mock data (analyses + profile); there
 * is no badge state to persist. Title/description resolve to i18n keys.
 */
import type { Analysis, StrokeType } from '@/src/types';

export interface Achievement {
  id: string;
  /** lucide icon name handled by the Profile screen. */
  icon: 'Award' | 'Flame' | 'Target' | 'TrendingUp' | 'Layers' | 'Star';
  titleKey: string;
  descKey: string;
  earned: boolean;
}

const WEEK_MS = 7 * 86_400_000;

/** True if any 7-day window contains 2+ analyses. */
function hasWeekStreak(analyses: Analysis[]): boolean {
  const times = analyses
    .map((a) => new Date(a.createdAt).getTime())
    .sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) {
    if (times[i] - times[i - 1] <= WEEK_MS) return true;
  }
  return false;
}

/** True if any stroke's latest score beats an earlier score of that stroke. */
function hasImproved(analyses: Analysis[]): boolean {
  const byStroke = new Map<StrokeType, Analysis[]>();
  for (const a of analyses) {
    const list = byStroke.get(a.strokeType) ?? [];
    list.push(a);
    byStroke.set(a.strokeType, list);
  }
  for (const list of byStroke.values()) {
    const sorted = [...list].sort(
      (x, y) =>
        new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime(),
    );
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].overallScore > sorted[0].overallScore) return true;
    }
  }
  return false;
}

/** Compute the full badge set; earned flags reflect the user's progress. */
export function getAchievements(analyses: Analysis[]): Achievement[] {
  const count = analyses.length;
  const bestScore = analyses.reduce((m, a) => Math.max(m, a.overallScore), 0);
  const distinctStrokes = new Set(analyses.map((a) => a.strokeType)).size;

  return [
    {
      id: 'first-analysis',
      icon: 'Award',
      titleKey: 'achv.firstAnalysis.title',
      descKey: 'achv.firstAnalysis.desc',
      earned: count >= 1,
    },
    {
      id: 'five-analyses',
      icon: 'Star',
      titleKey: 'achv.fiveAnalyses.title',
      descKey: 'achv.fiveAnalyses.desc',
      earned: count >= 5,
    },
    {
      id: 'high-scorer',
      icon: 'Target',
      titleKey: 'achv.highScorer.title',
      descKey: 'achv.highScorer.desc',
      earned: bestScore >= 80,
    },
    {
      id: 'improver',
      icon: 'TrendingUp',
      titleKey: 'achv.improver.title',
      descKey: 'achv.improver.desc',
      earned: hasImproved(analyses),
    },
    {
      id: 'week-warrior',
      icon: 'Flame',
      titleKey: 'achv.weekWarrior.title',
      descKey: 'achv.weekWarrior.desc',
      earned: hasWeekStreak(analyses),
    },
    {
      id: 'all-rounder',
      icon: 'Layers',
      titleKey: 'achv.allRounder.title',
      descKey: 'achv.allRounder.desc',
      earned: distinctStrokes >= 4,
    },
  ];
}

/** Current daily-ish streak proxy: count of analyses in the last 7 days. */
export function analysesThisWeek(analyses: Analysis[]): number {
  const cutoff = Date.now() - WEEK_MS;
  return analyses.filter((a) => new Date(a.createdAt).getTime() >= cutoff)
    .length;
}

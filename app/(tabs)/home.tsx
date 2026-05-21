/**
 * S3 — Home Screen (SPEC §4 S3, §10 professional extras).
 *
 * Command centre. Navy hero area (Zones A–D) bleeds under the status bar;
 * the light section below (Zones E–F) holds the recent-analyses row, stat
 * cards and the coaching tip.
 */
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Coins, Video } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Skeleton, Text, cardShadow } from '@/src/components/ui';
import {
  AnalysisSummaryCard,
  CoachingTipCard,
  EmptyState,
  SponsorBadge,
} from '@/src/components/shared';

import { useTranslation } from '@/src/hooks/useTranslation';
import { useAnalysisStore, useCreditStore } from '@/src/store';
import { colors } from '@/src/theme';
import { tipOfTheDay } from '@/src/constants/tips';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Count analyses with createdAt within the last 7 days. */
function countThisWeek(analyses: { createdAt: string }[]): number {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return analyses.filter((a) => new Date(a.createdAt).getTime() >= cutoff)
    .length;
}

/** Round to 1 decimal place; returns '-' if no analyses. */
function avgScore(scores: number[]): string {
  if (scores.length === 0) return '—';
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  return Math.round(avg).toString();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // ── Store subscriptions ───────────────────────────────────────────────────
  const balance = useCreditStore((s) => s.balance);
  const analyses = useAnalysisStore((s) => s.analyses);
  const analysisLoading = useAnalysisStore((s) => s.loading);

  // ── Hydrate on mount only if the root layout hasn't already done so ───────
  useEffect(() => {
    if (!useAnalysisStore.getState().hydrated) {
      void useAnalysisStore.getState().hydrate();
    }
    if (!useCreditStore.getState().hydrated) {
      void useCreditStore.getState().hydrate();
    }
  }, []);

  // ── Coaching tip (stable for the day) ────────────────────────────────────
  const tip = useMemo(() => tipOfTheDay(), []);

  // ── Stats derived from analyses ───────────────────────────────────────────
  const scores = analyses.map((a) => a.overallScore);
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const weekCount = countThisWeek(analyses);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-light">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ═══════════════════════════════════════════════════════════════
            NAVY HERO SECTION  (Zones A → D)
            Bleeds under the status bar via paddingTop=insets.top.
        ════════════════════════════════════════════════════════════════ */}
        <View className="bg-navy" style={{ paddingTop: insets.top }}>

          {/* ── Zone A: Header bar ───────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-5 py-3">
            {/* App name wordmark */}
            <Text
              className="font-display text-[18px] text-primary"
              accessibilityRole="header"
            >
              {t('common.appName')}
            </Text>

            {/* Credit chip — taps to Wallet */}
            <Pressable
              onPress={() => router.push('/(tabs)/wallet')}
              accessibilityRole="button"
              accessibilityLabel={`${balance} ${t('common.creditsLabel')}`}
              className="flex-row items-center gap-1.5 rounded-full bg-deep-navy px-3 py-1.5"
            >
              <Coins size={14} color={colors.scoreAmber} />
              <Text className="font-mono text-[13px] text-white">
                {balance}
              </Text>
              <Text variant="caption" className="text-slate text-[11px]">
                {t('common.creditsLabel')}
              </Text>
            </Pressable>
          </View>

          {/* ── Zone B: Sponsor strip ────────────────────────────────── */}
          <View className="h-7 items-center justify-center bg-deep-navy">
            <SponsorBadge variant="plain" />
          </View>

          {/* ── Zone C: Hero headline + subtext ─────────────────────── */}
          <View className="px-5 pt-8 pb-4">
            <Text
              className="font-display text-[24px] leading-[30px] text-white"
              accessibilityRole="header"
            >
              {t('home.heroHeadline')}
            </Text>
            <Text variant="body" className="mt-2 text-slate">
              {t('home.heroSubtext')}
            </Text>
          </View>

          {/* ── Zone D: Primary CTA ──────────────────────────────────── */}
          <View className="items-center pb-8 px-5">
            <Pressable
              onPress={() => router.push('/upload')}
              accessibilityRole="button"
              accessibilityLabel={t('home.uploadCta')}
              className="w-[90%] h-14 flex-row items-center justify-center gap-2.5 rounded-card bg-orange"
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <Video size={20} color={colors.white} />
              <Text className="font-label text-[16px] font-medium text-white">
                {t('home.uploadCta')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════════════════
            LIGHT SECTION  (Zones E → F)
        ════════════════════════════════════════════════════════════════ */}

        {/* ── Professional extras: stat cards ─────────────────────────
            Hidden on cold start — stat cards full of "0 / —" alongside the
            empty state below would be two conflicting "empty" signals. */}
        {analyses.length > 0 && (
          <View className="flex-row gap-3 px-5 pt-6">
            <StatCard
              label={t('home.statAnalyses')}
              value={weekCount.toString()}
              caption={t('home.thisWeek', { count: weekCount })}
            />
            <StatCard
              label={t('home.statBestScore')}
              value={bestScore !== null ? bestScore.toString() : '—'}
            />
            <StatCard label={t('home.statAvgScore')} value={avgScore(scores)} />
          </View>
        )}

        {/* ── Zone E: Recent Analyses ──────────────────────────────── */}
        <View className="mt-6">
          {/* Section header */}
          <View className="flex-row items-center justify-between px-5 mb-3">
            <Text variant="h2" className="text-[16px] text-ink">
              {t('home.recentAnalyses')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/history')}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text variant="label" className="text-primary text-[14px]">
                {t('common.seeAll')}
              </Text>
            </Pressable>
          </View>

          {/* Loading state: 3 skeleton cards */}
          {analysisLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              <Skeleton className="w-[170px] h-[140px] rounded-card" />
              <Skeleton className="w-[170px] h-[140px] rounded-card" />
              <Skeleton className="w-[170px] h-[140px] rounded-card" />
            </ScrollView>
          ) : analyses.length === 0 ? (
            /* Empty state */
            <View className="mx-5 rounded-card bg-white" style={cardShadow}>
              <EmptyState
                icon={Video}
                title={t('empty.homeTitle')}
                subtitle={t('empty.homeSubtext')}
                ctaLabel={t('empty.homeCta')}
                onCtaPress={() => router.push('/upload')}
              />
            </View>
          ) : (
            /* Horizontal scroll row */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {analyses.map((a) => (
                <AnalysisSummaryCard
                  key={a.id}
                  analysis={a}
                  onPress={() => router.push(`/analysis/${a.id}`)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Zone F: Coaching Tip of the Day ─────────────────────── */}
        <View className="px-5 mt-6">
          <CoachingTipCard
            title={t('home.tipOfTheDay')}
            tip={t(tip.textKey)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Stat card sub-component ───────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
}

function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <Card className="flex-1 items-center py-3 px-2">
      <Text variant="caption" className="text-slate text-center mb-1">
        {label}
      </Text>
      <Text className="font-display text-[22px] text-ink leading-[28px]">
        {value}
      </Text>
      {caption ? (
        <Text variant="caption" className="text-slate text-center mt-0.5 text-[10px]">
          {caption}
        </Text>
      ) : null}
    </Card>
  );
}

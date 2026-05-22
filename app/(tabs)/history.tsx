/**
 * S13 — Analysis History (SPEC §4 S13).
 *
 * Tab 3. Full log of past analyses, with:
 *  - A horizontal chip filter row (All + each stroke type).
 *  - A sort control (Date / Score / Stroke) opening a SelectSheet.
 *  - Swipe-left-to-delete via react-native-gesture-handler Swipeable.
 *  - A ConfirmationModal before committing the delete.
 *  - A delta badge on each card showing progress vs. the previous same-stroke
 *    analysis.
 *  - Loading skeleton rows (via ListEmptyComponent when loading) and an empty
 *    state.
 *  - FlatList for virtualized rendering.
 *  - Marks all unread analyses as seen on mount.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ClipboardList, SlidersHorizontal } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Analysis, StrokeType } from '@/src/types';
import { STROKE_TYPES } from '@/src/types';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useAnalysisStore } from '@/src/store';
import { AnalysisHistoryCard, EmptyState, SelectSheet } from '@/src/components/shared';
import type { SelectOption } from '@/src/components/shared';
import { Badge, Chip, ConfirmationModal, Skeleton, Text } from '@/src/components/ui';
import { colors } from '@/src/theme';

type StrokeFilter = 'all' | StrokeType;
type SortKey = 'date' | 'score' | 'stroke';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const analyses = useAnalysisStore((s) => s.analyses);
  const loading = useAnalysisStore((s) => s.loading);

  const [strokeFilter, setStrokeFilter] = useState<StrokeFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // Delete confirmation state
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Keep references to open Swipeable instances so we can close them.
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  // Clear unread badge when the History tab is opened.
  useEffect(() => {
    useAnalysisStore.getState().markAllSeen();
  }, []);

  const sortOptions: SelectOption[] = [
    { value: 'date', label: t('history.sortDate') },
    { value: 'score', label: t('history.sortScore') },
    { value: 'stroke', label: t('history.sortStroke') },
  ];

  // Filter
  const filteredAnalyses = useMemo<Analysis[]>(() => {
    if (strokeFilter === 'all') return analyses;
    return analyses.filter((a) => a.strokeType === strokeFilter);
  }, [analyses, strokeFilter]);

  // Sort
  const sortedAnalyses = useMemo<Analysis[]>(() => {
    const copy = [...filteredAnalyses];
    if (sortKey === 'date') {
      copy.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortKey === 'score') {
      copy.sort((a, b) => b.overallScore - a.overallScore);
    } else {
      copy.sort((a, b) => a.strokeType.localeCompare(b.strokeType));
    }
    return copy;
  }, [filteredAnalyses, sortKey]);

  /**
   * Signed score delta for each analysis vs. the previous (older) analysis of
   * the SAME stroke type. Computed once per `analyses` change in a single pass
   * (the store list is newest-first, so we walk it oldest-first).
   */
  const deltaById = useMemo(() => {
    const map = new Map<string, number>();
    const prevScore: Partial<Record<StrokeType, number>> = {};
    for (let i = analyses.length - 1; i >= 0; i--) {
      const a = analyses[i];
      const prev = prevScore[a.strokeType];
      if (prev !== undefined) map.set(a.id, a.overallScore - prev);
      prevScore[a.strokeType] = a.overallScore;
    }
    return map;
  }, [analyses]);

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    setDeleteLoading(true);
    try {
      await useAnalysisStore.getState().remove(pendingDeleteId);
    } finally {
      setDeleteLoading(false);
      setPendingDeleteId(null);
    }
  }

  const sortLabel = sortOptions.find((o) => o.value === sortKey)?.label ?? '';

  /** FlatList header: the navy title bar + filter chip row. */
  const ListHeader = (
    <>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        className="bg-navy px-5 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Text variant="h1" className="text-white text-[20px]">
              {t('history.title')}
            </Text>
            {analyses.length > 0 ? (
              <Badge
                label={t('history.totalCount', { count: analyses.length })}
                tone="primary"
              />
            ) : null}
          </View>

          {/* Sort button */}
          <Pressable
            onPress={() => setSortSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('history.sortBy')}
            className="flex-row items-center gap-1.5 rounded-chip border border-white/30 px-3 py-1.5"
          >
            <SlidersHorizontal size={14} color={colors.white} />
            <Text variant="caption" className="text-white text-[12px]">
              {t('history.sortBy')}: {sortLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Stroke filter chips ───────────────────────────────────────────── */}
      <View className="bg-white border-b border-border">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
        >
          <Chip
            label={t('history.filterAll')}
            active={strokeFilter === 'all'}
            onPress={() => setStrokeFilter('all')}
          />
          {STROKE_TYPES.map((stroke) => (
            <Chip
              key={stroke}
              label={t(`stroke.${stroke}`)}
              active={strokeFilter === stroke}
              onPress={() => setStrokeFilter(stroke)}
            />
          ))}
        </ScrollView>
      </View>
    </>
  );

  /** Skeletons shown while the store is hydrating. */
  const LoadingSkeleton = (
    <View
      style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
    >
      {[0, 1, 2].map((i) => (
        <View key={i} className="mb-3 flex-row gap-3 rounded-card bg-white p-3">
          <Skeleton className="h-20 w-20 rounded-input" />
          <View className="flex-1 gap-2 justify-center">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </View>
          <Skeleton className="h-12 w-12 rounded-full self-center" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-light">
      <FlatList
        data={loading ? [] : sortedAnalyses}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          loading ? (
            LoadingSkeleton
          ) : (
            <View className="flex-1 justify-center" style={{ marginTop: 80 }}>
              <EmptyState
                icon={ClipboardList}
                title={t('empty.historyTitle')}
                subtitle={t('empty.historySubtext')}
                ctaLabel={t('empty.historyCta')}
                onCtaPress={() => router.push('/upload')}
              />
            </View>
          )
        }
        renderItem={({ item: analysis }) => (
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <SwipeableRow
              swipeableRef={(ref) => {
                swipeableRefs.current[analysis.id] = ref;
              }}
              onDeletePress={() => {
                // Close any other open swipeables
                Object.entries(swipeableRefs.current).forEach(([rowId, ref]) => {
                  if (rowId !== analysis.id) ref?.close();
                });
                setPendingDeleteId(analysis.id);
              }}
            >
              <AnalysisHistoryCard
                analysis={analysis}
                delta={deltaById.get(analysis.id)}
                onPress={() => router.push(`/analysis/${analysis.id}`)}
              />
            </SwipeableRow>
          </View>
        )}
      />

      {/* ── Sort sheet ────────────────────────────────────────────────────── */}
      <SelectSheet
        visible={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title={t('history.sortBy')}
        options={sortOptions}
        selectedValue={sortKey}
        onSelect={(v) => setSortKey(v as SortKey)}
        heightRatio={0.4}
      />

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      <ConfirmationModal
        visible={pendingDeleteId !== null}
        title={t('history.deleteTitle')}
        message={t('history.deleteBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        confirmLoading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => {
          setPendingDeleteId(null);
          // Close swipeable for the cancelled item
          if (pendingDeleteId) {
            swipeableRefs.current[pendingDeleteId]?.close();
          }
        }}
      />
    </View>
  );
}

/** Wraps a card in a Swipeable that reveals a red Delete action on left-swipe. */
function SwipeableRow({
  children,
  onDeletePress,
  swipeableRef,
}: {
  children: React.ReactNode;
  onDeletePress: () => void;
  swipeableRef: (ref: Swipeable | null) => void;
}) {
  const { t } = useTranslation();
  const renderRightActions = () => {
    return (
      <Pressable
        onPress={onDeletePress}
        accessibilityRole="button"
        accessibilityLabel={t('common.delete')}
        className="mb-3 w-20 items-center justify-center rounded-r-card bg-score-red"
      >
        <View className="items-center justify-center">
          <Text variant="label" className="text-white text-[13px]">
            {t('common.delete')}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {children}
    </Swipeable>
  );
}

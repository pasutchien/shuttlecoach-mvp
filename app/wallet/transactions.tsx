/**
 * S12 — Transaction History (SPEC §4 S12).
 *
 * Full-screen push from the Wallet tab. Shows the full credit ledger with a
 * three-way filter (All / Purchases / Analyses) and an empty state when no
 * transactions match.
 *
 * Positive credits (purchase / refund) → score-green.
 * Negative credits (analysis deduction) → score-red.
 *
 * Uses FlatList for virtualized rendering.
 */
import { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Receipt } from 'lucide-react-native';
import type { TransactionType } from '@/src/types';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreditStore } from '@/src/store';
import { EmptyState } from '@/src/components/shared';
import { SegmentedControl, Text } from '@/src/components/ui';
import type { SegmentOption } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { formatDate, formatNumber } from '@/src/lib/format';

type FilterKey = 'all' | 'purchases' | 'analyses';

/** Transaction types included in each filter tab. */
const FILTER_TYPES: Record<FilterKey, TransactionType[] | null> = {
  all: null,
  purchases: ['purchase', 'refund'],
  analyses: ['analysis'],
};

export default function TransactionsScreen() {
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const transactions = useCreditStore((s) => s.transactions);
  const [filter, setFilter] = useState<FilterKey>('all');

  // Localised filter labels (read at render time so locale switches work)
  const filterOptions: SegmentOption<FilterKey>[] = [
    { value: 'all', label: t('transactions.filterAll') },
    { value: 'purchases', label: t('transactions.filterPurchases') },
    { value: 'analyses', label: t('transactions.filterAnalyses') },
  ];

  const filtered = useMemo(() => {
    const types = FILTER_TYPES[filter];
    if (!types) return transactions;
    return transactions.filter((tx) => types.includes(tx.type));
  }, [transactions, filter]);

  /** FlatList header: back button + title + segmented filter. */
  const ListHeader = (
    <>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        className="bg-navy flex-row items-center px-5 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          className="mr-3 h-11 w-11 items-center justify-center"
        >
          <ChevronLeft size={24} color={colors.white} />
        </Pressable>
        <Text variant="h1" className="flex-1 text-white text-[20px]">
          {t('transactions.title')}
        </Text>
      </View>

      {/* ── Filter ────────────────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-3">
        <SegmentedControl
          options={filterOptions}
          value={filter}
          onChange={setFilter}
        />
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-light">
      <FlatList
        data={filtered}
        keyExtractor={(tx) => tx.id}
        ListHeaderComponent={ListHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="flex-1 justify-center" style={{ marginTop: 80 }}>
            <EmptyState
              icon={Receipt}
              title={t('empty.transactionsTitle')}
              subtitle={t('empty.transactionsSubtext')}
              ctaLabel={t('empty.transactionsCta')}
              onCtaPress={() => router.push('/(tabs)/wallet')}
            />
          </View>
        }
        renderItem={({ item: tx }) => {
          const positive = tx.credits > 0;
          const sign = positive ? '+' : '';
          const creditColor = positive ? colors.scoreGreen : colors.scoreRed;

          return (
            <View
              className="mb-3 flex-row items-center justify-between rounded-card bg-white p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              {/* Left: date + label */}
              <View className="flex-1 mr-3">
                <Text variant="caption" className="mb-0.5 text-slate">
                  {formatDate(tx.date, locale)}
                </Text>
                <Text variant="bodyMedium" className="text-ink text-[14px]" numberOfLines={1}>
                  {sign}
                  {formatNumber(Math.abs(tx.credits))} {t('common.credits')} — {tx.label}
                </Text>
                <Text variant="caption" className="mt-0.5 text-slate">
                  {t('transactions.balanceAfter', { balance: formatNumber(tx.balanceAfter) })}
                </Text>
              </View>

              {/* Right: signed credits in colour */}
              <Text
                variant="mono"
                className="text-[15px] font-mono"
                style={{ color: creditColor }}
              >
                {sign}
                {formatNumber(Math.abs(tx.credits))}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

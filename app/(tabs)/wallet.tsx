/**
 * S11 — Wallet & Store (SPEC §4 S11).
 *
 * Reachable via Tab 2 or as a push from the insufficient-credits flow (S7).
 * When pushed (router.canGoBack() === true) a back chevron is shown top-left.
 *
 * Zone A — current credit balance card with Transaction History link.
 * Zone B — package purchase grid (2-up row + full-width Pro Pack).
 * Zone C — payment method chips.
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, CreditCard, Smartphone } from 'lucide-react-native';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useCreditStore } from '@/src/store';
import { ANALYSIS_COST, CREDIT_PACKAGES } from '@/src/constants/packages';
import { PackageCard } from '@/src/components/shared';
import { Card, Text, toast } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { formatNumber } from '@/src/lib/format';
import { hapticSuccess } from '@/src/lib/haptics';

export default function WalletScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const balance = useCreditStore((s) => s.balance);
  const canGoBack = router.canGoBack();
  const analysesLeft = Math.floor(balance / ANALYSIS_COST);

  // Per-package loading state (keyed by package id)
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleBuy(pkgId: string, credits: number, label: string) {
    if (loadingId) return;
    setLoadingId(pkgId);
    try {
      await useCreditStore.getState().purchase(pkgId);
      hapticSuccess();
      toast(t('wallet.purchaseToast', { credits, label }), 'success');
    } catch {
      toast(t('error.title'), 'error');
    } finally {
      setLoadingId(null);
    }
  }

  // Split packages: first two in the 2-up row, last (Pro Pack) full-width.
  const rowPackages = CREDIT_PACKAGES.filter((p) => !p.mostPopular);
  const proPackage = CREDIT_PACKAGES.find((p) => p.mostPopular);

  return (
    <View className="flex-1 bg-light">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View
        className="bg-navy flex-row items-center px-5 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            className="mr-3 h-11 w-11 items-center justify-center"
          >
            <ChevronLeft size={24} color={colors.white} />
          </Pressable>
        ) : null}
        <Text variant="h1" className="flex-1 text-white text-[20px]">
          {t('wallet.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone A — Balance Card ─────────────────────────────────────── */}
        <Card className="mb-6">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text variant="caption" className="mb-1 text-slate uppercase tracking-wide text-[11px]">
                {t('wallet.balanceLabel')}
              </Text>
              <Text className="font-display text-[40px] leading-[44px] text-primary">
                {formatNumber(balance)}
              </Text>
              <Text variant="caption" className="mt-1 text-slate">
                {t('wallet.balanceSubline')}
              </Text>

              {/* Analyses-left indicator */}
              {analysesLeft === 0 ? (
                <View className="mt-2 self-start rounded-card bg-score-amber/12 px-3 py-1.5">
                  <Text variant="caption" className="text-score-amber text-[12px]">
                    {t('wallet.lowBalance')}
                  </Text>
                </View>
              ) : (
                <Text variant="caption" className="mt-2 text-slate text-[12px]">
                  {analysesLeft === 1
                    ? t('wallet.analysesLeftOne')
                    : t('wallet.analysesLeft', { count: analysesLeft })}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => router.push('/wallet/transactions')}
              accessibilityRole="link"
              className="mt-1"
            >
              <Text variant="label" className="text-primary text-[13px]">
                {t('wallet.transactionHistory')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* ── Zone B — Package Grid ─────────────────────────────────────── */}
        <Text variant="h2" className="mb-3 text-[16px]">
          {t('wallet.buyCredits')}
        </Text>

        {/* 2-up row (Single Match + Practice Pack) */}
        <View className="mb-3 flex-row gap-3">
          {rowPackages.map((pkg) => (
            <View key={pkg.id} className="flex-1">
              <PackageCard
                pkg={pkg}
                fullWidth={false}
                loading={loadingId === pkg.id}
                onBuy={() =>
                  handleBuy(pkg.id, pkg.credits, t(pkg.bestForKey))
                }
              />
            </View>
          ))}
        </View>

        {/* Pro Pack — full-width */}
        {proPackage ? (
          <PackageCard
            pkg={proPackage}
            fullWidth
            loading={loadingId === proPackage.id}
            onBuy={() =>
              handleBuy(
                proPackage.id,
                proPackage.credits,
                t(proPackage.bestForKey),
              )
            }
            className="mb-6"
          />
        ) : null}

        {/* ── Zone C — Payment Methods ──────────────────────────────────── */}
        <Text variant="caption" className="mb-3 text-slate text-[12px]">
          {t('wallet.paymentMethods')}
        </Text>
        <View className="flex-row gap-3">
          <PaymentChip icon={<Smartphone size={16} color={colors.primary} />} label="PromptPay" />
          <PaymentChip icon={<CreditCard size={16} color={colors.slate} />} label="Visa / Mastercard" />
        </View>
      </ScrollView>
    </View>
  );
}

/** A simple labelled pill for each payment method. */
function PaymentChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-2 rounded-chip border border-border bg-white px-3 py-2">
      {icon}
      <Text variant="caption" className="text-ink">
        {label}
      </Text>
    </View>
  );
}

/**
 * Credit package purchase card (SPEC §4 S11, §11.3). The Pro Pack renders
 * full-width with a "Most Popular" pill so it visually dominates.
 */
import { View } from 'react-native';
import type { CreditPackage } from '@/src/types';
import { formatNumber } from '@/src/lib/format';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Badge, Button, Card, Text } from '@/src/components/ui';
import { cn } from '@/src/lib/cn';

export interface PackageCardProps {
  pkg: CreditPackage;
  onBuy: () => void;
  loading?: boolean;
  /** Full-width layout (used for the Pro Pack). */
  fullWidth?: boolean;
  className?: string;
}

export function PackageCard({
  pkg,
  onBuy,
  loading = false,
  fullWidth = false,
  className,
}: PackageCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        'rounded-card-lg',
        pkg.mostPopular && 'border-2 border-orange',
        className,
      )}
    >
      {/* "Most Popular" pill — a clean badge, not a clipped ribbon */}
      {pkg.mostPopular ? (
        <View className="mb-3 self-start rounded-full bg-orange px-3 py-1">
          <Text
            className="font-heading-bold text-[10px] text-white"
            style={{ letterSpacing: 0.6 }}
          >
            {t('wallet.mostPopular').toUpperCase()}
          </Text>
        </View>
      ) : null}

      <View className={cn(fullWidth && 'flex-row items-center')}>
        <View className={cn(fullWidth ? 'flex-1' : 'items-start')}>
          <View className="flex-row items-baseline gap-1.5">
            <Text className="font-display text-[30px] leading-[34px] text-ink">
              {formatNumber(pkg.credits)}
            </Text>
            <Text variant="label" className="text-[13px] text-slate">
              {t('common.creditsLabel')}
            </Text>
          </View>
          <View className="mt-1.5 flex-row items-center gap-2">
            <Text className="font-heading-bold text-[16px] text-ink">
              ฿{pkg.priceThb}
            </Text>
            {pkg.savingsPct ? (
              <Badge
                tone="success"
                label={t('wallet.save', { percent: pkg.savingsPct })}
              />
            ) : null}
          </View>
        </View>

        <Button
          label={t('wallet.buyNow')}
          variant="orange"
          size="md"
          loading={loading}
          onPress={onBuy}
          className={cn(fullWidth ? 'ml-3 w-[130px]' : 'mt-3 w-full')}
          block={!fullWidth}
        />
      </View>
    </Card>
  );
}

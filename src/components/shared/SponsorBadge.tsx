/**
 * Sponsor badge (SPEC §11.5, §12). "PRESENTED BY BANTHONGYORD".
 *
 * Variants:
 *  - `dark`  — white text on an orange pill (for light surfaces / share cards)
 *  - `light` — orange text on a white pill (for light surfaces)
 *  - `plain` — orange text, no background (splash & the Home sponsor strip)
 */
import { View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Text } from '@/src/components/ui';
import { t } from '@/src/i18n';

export type SponsorBadgeVariant = 'dark' | 'light' | 'plain';

export interface SponsorBadgeProps {
  variant?: SponsorBadgeVariant;
  className?: string;
}

export function SponsorBadge({
  variant = 'plain',
  className,
}: SponsorBadgeProps) {
  const label = t('common.sponsor');
  const isPill = variant !== 'plain';

  return (
    <View
      className={cn(
        'self-center',
        isPill && 'rounded px-3 py-1.5',
        variant === 'dark' && 'bg-orange',
        variant === 'light' && 'bg-white',
        className,
      )}
      accessibilityLabel={label}
    >
      <Text
        className={cn(
          'font-label text-[11px]',
          variant === 'dark' ? 'text-white' : 'text-orange',
        )}
        style={{ letterSpacing: 0.88 }}
      >
        {label}
      </Text>
    </View>
  );
}

/**
 * Empty state (SPEC §6.1). Illustration + headline + subtext + CTA.
 */
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button, Text } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { cn } from '@/src/lib/cn';

export interface EmptyStateProps {
  /** Lucide icon used as the illustration. */
  icon: LucideIcon;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn('items-center px-6 py-8', className)}>
      <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-tip-bg">
        <Icon size={36} color={colors.primary} />
      </View>
      <Text variant="h2" className="text-center text-[18px]">
        {title}
      </Text>
      <Text variant="body" className="mt-1.5 text-center text-slate">
        {subtitle}
      </Text>
      {ctaLabel && onCtaPress ? (
        <Button
          label={ctaLabel}
          variant="orange"
          size="md"
          block={false}
          onPress={onCtaPress}
          className="mt-5 px-6"
        />
      ) : null}
    </View>
  );
}

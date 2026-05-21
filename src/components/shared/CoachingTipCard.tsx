/**
 * Coaching Tip Card (SPEC §4 S3 Zone F, §11.3). Non-interactive in the MVP.
 */
import { View } from 'react-native';
import { Lightbulb } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { cn } from '@/src/lib/cn';

export interface CoachingTipCardProps {
  title: string;
  tip: string;
  className?: string;
}

export function CoachingTipCard({ title, tip, className }: CoachingTipCardProps) {
  return (
    <View
      className={cn(
        'flex-row gap-3 rounded-card border border-tip-border bg-tip-bg p-card',
        className,
      )}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
        <Lightbulb size={18} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text variant="label" className="text-[13px] text-primary">
          {title}
        </Text>
        <Text variant="body" className="mt-0.5 text-ink">
          {tip}
        </Text>
      </View>
    </View>
  );
}

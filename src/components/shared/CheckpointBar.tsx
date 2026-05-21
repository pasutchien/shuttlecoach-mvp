/**
 * Checkpoint sub-score row (SPEC §8.1) — used in the S9 checkpoint breakdown.
 */
import { View } from 'react-native';
import { Text } from '@/src/components/ui';
import { scoreColorHex } from '@/src/lib/score';
import { cn } from '@/src/lib/cn';

export interface CheckpointBarProps {
  label: string;
  /** 0–100 sub-score. */
  score: number;
  className?: string;
}

export function CheckpointBar({ label, score, className }: CheckpointBarProps) {
  const hex = scoreColorHex(score);
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <Text variant="body" className="w-[110px] text-[13px]" numberOfLines={1}>
        {label}
      </Text>
      <View className="h-2 flex-1 overflow-hidden rounded-full bg-light">
        <View
          className="h-full rounded-full"
          style={{ width: `${Math.max(4, score)}%`, backgroundColor: hex }}
        />
      </View>
      <Text className="w-7 text-right font-mono text-[13px]" style={{ color: hex }}>
        {score}
      </Text>
    </View>
  );
}

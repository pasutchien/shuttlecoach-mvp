/**
 * Badge — a small pill label (severity chips, "Save 10%", counts).
 */
import { View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Text } from './Text';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'mint';

const TONE: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: 'bg-light', text: 'text-slate' },
  primary: { bg: 'bg-primary', text: 'text-white' },
  success: { bg: 'bg-score-green', text: 'text-white' },
  warning: { bg: 'bg-score-amber', text: 'text-white' },
  danger: { bg: 'bg-score-red', text: 'text-white' },
  mint: { bg: 'bg-mint', text: 'text-white' },
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  className?: string;
}

export function Badge({ label, tone = 'neutral', className }: BadgeProps) {
  const t = TONE[tone];
  return (
    <View
      className={cn(
        'self-start rounded-full px-2.5 py-1',
        t.bg,
        className,
      )}
    >
      <Text variant="label" className={cn('text-[11px]', t.text)}>
        {label}
      </Text>
    </View>
  );
}

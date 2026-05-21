/**
 * Badge — a small pill label (severity chips, "Save 10%", counts).
 *
 * Premium pattern: a tinted background with deep-tone text, rather than white
 * text on a saturated fill (which looks garish at small sizes). The `solid`
 * prop opts back into a saturated fill for count/notification badges.
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

/** Tinted background + deep-tone text. */
const TINTED: Record<BadgeTone, { bg: string; text: string }> = {
  neutral: { bg: 'bg-slate/10', text: 'text-ink-soft' },
  primary: { bg: 'bg-primary/12', text: 'text-primary-deep' },
  success: { bg: 'bg-score-green/15', text: 'text-green-deep' },
  warning: { bg: 'bg-score-amber/15', text: 'text-amber-deep' },
  danger: { bg: 'bg-score-red/12', text: 'text-red-deep' },
  mint: { bg: 'bg-mint/15', text: 'text-mint-strong' },
};

/** Saturated fill + white text (count / notification badges). */
const SOLID: Record<BadgeTone, string> = {
  neutral: 'bg-slate',
  primary: 'bg-primary',
  success: 'bg-score-green',
  warning: 'bg-score-amber',
  danger: 'bg-score-red',
  mint: 'bg-mint',
};

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Saturated fill with white text, for count badges. */
  solid?: boolean;
  className?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  solid = false,
  className,
}: BadgeProps) {
  const t = TINTED[tone];
  return (
    <View
      className={cn(
        'self-start rounded-full px-2.5 py-1',
        solid ? SOLID[tone] : t.bg,
        className,
      )}
    >
      <Text
        className={cn(
          'font-heading-bold text-[11px]',
          solid ? 'text-white' : t.text,
        )}
      >
        {label}
      </Text>
    </View>
  );
}

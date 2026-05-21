/**
 * Chip / Tag (SPEC §11.1). Used for filters, goal selection and small tags.
 */
import { Pressable, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  /** Render a static tag (no press affordance). */
  static?: boolean;
  className?: string;
}

export function Chip({
  label,
  active = false,
  onPress,
  static: isStatic = false,
  className,
}: ChipProps) {
  const content = (
    <Text
      variant="label"
      className={cn('text-[12px]', active ? 'text-white' : 'text-slate')}
    >
      {label}
    </Text>
  );

  const classes = cn(
    'h-7 items-center justify-center rounded-chip px-3',
    active ? 'bg-primary' : 'bg-light',
    className,
  );

  if (isStatic || !onPress) {
    return <View className={classes}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      // 28pt visual height + 8pt slop each side → ≥44pt touch target (SPEC §5.4).
      hitSlop={8}
      className={classes}
    >
      {content}
    </Pressable>
  );
}

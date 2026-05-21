/**
 * Card surface (SPEC §11.3). White surface, 12pt radius, soft shadow.
 */
import { Pressable, View, type ViewProps } from 'react-native';
import { cn } from '@/src/lib/cn';

export interface CardProps extends ViewProps {
  className?: string;
  /** Make the whole card pressable. */
  onPress?: () => void;
  /** Drop the default 16pt internal padding. */
  noPadding?: boolean;
  children?: React.ReactNode;
}

/** Shared soft shadow (0 2pt 8pt rgba(0,0,0,0.08)). */
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const;

export function Card({
  className,
  onPress,
  noPadding = false,
  accessibilityLabel,
  children,
  ...rest
}: CardProps) {
  const classes = cn(
    'rounded-card bg-white',
    !noPadding && 'p-card',
    className,
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardShadow, { opacity: pressed ? 0.92 : 1 }]}
        className={classes}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardShadow} className={classes} {...rest}>
      {children}
    </View>
  );
}

/**
 * Card surface (SPEC §11.3). White surface, 12pt radius, hairline border + a
 * soft navy-tinted resting shadow. The hairline keeps the card from "melting"
 * into a near-white background.
 */
import { Pressable, View, type ViewProps } from 'react-native';
import { cn } from '@/src/lib/cn';
import { shadows } from '@/src/theme';

export interface CardProps extends ViewProps {
  className?: string;
  /** Make the whole card pressable. */
  onPress?: () => void;
  /** Drop the default 16pt internal padding. */
  noPadding?: boolean;
  /** Drop the hairline border (e.g. cards on a dark surface). */
  noBorder?: boolean;
  children?: React.ReactNode;
}

/** Resting-level navy-tinted shadow (Level 1). */
export const cardShadow = shadows.cardResting;

export function Card({
  className,
  onPress,
  noPadding = false,
  noBorder = false,
  accessibilityLabel,
  children,
  ...rest
}: CardProps) {
  const classes = cn(
    'rounded-card bg-white',
    !noBorder && 'border border-border-soft',
    !noPadding && 'p-card',
    className,
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          shadows.cardResting,
          { transform: [{ scale: pressed ? 0.985 : 1 }] },
        ]}
        className={classes}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={shadows.cardResting} className={classes} {...rest}>
      {children}
    </View>
  );
}

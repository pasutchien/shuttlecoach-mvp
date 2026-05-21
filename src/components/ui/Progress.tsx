/**
 * Linear progress bar (SPEC §11 / S2 onboarding). `value` is 0–1.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export interface ProgressProps {
  /** Completion fraction, 0–1. */
  value: number;
  /** Track height in px. */
  height?: number;
  /** Tailwind class for the filled portion (default electric blue). */
  fillClassName?: string;
  trackClassName?: string;
  className?: string;
}

export function Progress({
  value,
  height = 6,
  fillClassName = 'bg-primary',
  trackClassName = 'bg-light',
  className,
}: ProgressProps) {
  const reduced = useReducedMotion();
  const pct = useSharedValue(Math.max(0, Math.min(1, value)));

  useEffect(() => {
    const target = Math.max(0, Math.min(1, value));
    pct.value = reduced ? target : withTiming(target, { duration: 320 });
  }, [value, reduced, pct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${pct.value * 100}%`,
  }));

  return (
    <View
      className={cn('w-full overflow-hidden rounded-full', trackClassName, className)}
      style={{ height }}
      accessibilityRole="progressbar"
      accessibilityValue={{ now: Math.round(value * 100), min: 0, max: 100 }}
    >
      <Animated.View
        className={cn('h-full rounded-full', fillClassName)}
        style={fillStyle}
      />
    </View>
  );
}

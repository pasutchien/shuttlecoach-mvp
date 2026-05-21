/**
 * Skeleton loader (SPEC §6.2 — "skeleton screens, not spinners"). A soft
 * opacity pulse; static when Reduce Motion is on.
 */
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/src/lib/cn';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export interface SkeletonProps {
  /** Tailwind classes for shape/size (width, height, rounding). */
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    if (reduced) {
      opacity.value = 0.6;
      return;
    }
    opacity.value = withRepeat(
      withTiming(1, { duration: 800 }),
      -1,
      true,
    );
  }, [reduced, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={cn('rounded-md bg-border', className)}
      style={style}
    />
  );
}

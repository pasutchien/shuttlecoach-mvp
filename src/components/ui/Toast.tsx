/**
 * Toast (SPEC §11.4). Global, single-slot: bottom pill, auto-dismiss after 3s,
 * tap to dismiss. `ToastHost` is mounted once in the root layout; fire toasts
 * from anywhere with `toast(...)`.
 */
import { useEffect } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { create } from 'zustand';
import { cn } from '@/src/lib/cn';
import { Text } from './Text';

export type ToastTone = 'default' | 'success' | 'error';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  current: ToastItem | null;
  show: (message: string, tone?: ToastTone) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (message, tone = 'default') =>
    set({ current: { id: Date.now(), message, tone } }),
  hide: () => set({ current: null }),
}));

/** Imperatively show a toast from anywhere (screens, stores, effects). */
export function toast(message: string, tone: ToastTone = 'default'): void {
  useToastStore.getState().show(message, tone);
}

const TONE_CLASS: Record<ToastTone, string> = {
  default: 'bg-ink',
  success: 'bg-ink',
  error: 'bg-ink',
};

const TONE_ACCENT: Record<ToastTone, string> = {
  default: 'text-white',
  success: 'text-score-green',
  error: 'text-score-red',
};

/** Mounted once at the app root — renders the active toast. */
export function ToastHost() {
  const current = useToastStore((s) => s.current);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!current) return;
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
      setTimeout(hide, 220);
    }, 3000);
    return () => clearTimeout(timer);
  }, [current, hide, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!current) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        style,
        { position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 88 },
      ]}
      className="items-center px-6"
    >
      <Pressable
        onPress={hide}
        accessibilityRole="alert"
        className={cn(
          'max-w-[80%] rounded-3xl px-4 py-3',
          TONE_CLASS[current.tone],
        )}
      >
        <Text
          variant="body"
          className={cn('text-[13px]', TONE_ACCENT[current.tone])}
        >
          {current.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

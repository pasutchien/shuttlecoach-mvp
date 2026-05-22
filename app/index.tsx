/**
 * S1 — Splash Screen (SPEC §4 S1).
 *
 * Minimal brand moment: a solid navy background, the shuttlecock logo mark and
 * the "Shuttle Coach" wordmark, with a small sponsor credit at the bottom.
 * Holds ~2s, then routes to the Login screen.
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/src/components/ui';
import { Logo, SponsorBadge } from '@/src/components/shared';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useUserStore } from '@/src/store';

export default function SplashScreen() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const hydrated = useUserStore((s) => s.hydrated);

  // A single gentle fade-in for the whole brand lockup.
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) opacity.value = withTiming(1, { duration: 700 });
  }, [reduced, opacity]);

  // Hold ~2s (the brand moment), then go to the Login screen.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => router.replace('/login'), 2000);
    return () => clearTimeout(timer);
  }, [hydrated]);

  const lockupStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View className="flex-1 items-center justify-center bg-navy">
      <Animated.View style={lockupStyle} className="items-center">
        <Logo size={88} />
        <Text className="mt-5 font-display text-[28px] text-white">
          {t('common.appName')}
        </Text>
      </Animated.View>

      {/* Small sponsor credit (SPEC §12) */}
      <View className="absolute bottom-14">
        <SponsorBadge variant="plain" />
      </View>
    </View>
  );
}

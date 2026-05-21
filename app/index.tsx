/**
 * S1 — Splash Screen (SPEC §4 S1).
 *
 * Brand moment + auth check. Logo / tagline / sponsor fade in, hold, then route
 * to Onboarding (new user) or Home (returning user).
 */
import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/src/components/ui';
import { SponsorBadge } from '@/src/components/shared';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { useUserStore } from '@/src/store';

export default function SplashScreen() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const profile = useUserStore((s) => s.profile);
  const hydrated = useUserStore((s) => s.hydrated);

  const logo = useSharedValue(reduced ? 1 : 0);
  const tagline = useSharedValue(reduced ? 1 : 0);
  const sponsor = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    logo.value = withTiming(1, { duration: 600 });
    tagline.value = withDelay(600, withTiming(1, { duration: 400 }));
    sponsor.value = withDelay(1000, withTiming(1, { duration: 400 }));
  }, [reduced, logo, tagline, sponsor]);

  // Hold ~2s then route based on auth state.
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      router.replace(profile ? '/(tabs)/home' : '/onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [hydrated, profile]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logo.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: tagline.value }));
  const sponsorStyle = useAnimatedStyle(() => ({ opacity: sponsor.value }));

  return (
    <View className="flex-1 items-center justify-center bg-navy">
      {/* Subtle depth overlay (navy → deep-navy) */}
      <View className="absolute inset-x-0 bottom-0 h-1/2 bg-deep-navy/60" />

      <Animated.View style={logoStyle} className="items-center">
        <Text className="font-display text-[36px] text-primary">
          {t('common.appName')}
        </Text>
      </Animated.View>

      <Animated.View style={taglineStyle} className="mt-3">
        <Text variant="body" className="text-center text-light">
          {t('splash.tagline')}
        </Text>
      </Animated.View>

      <Animated.View style={sponsorStyle} className="absolute bottom-16">
        <SponsorBadge variant="plain" />
      </Animated.View>
    </View>
  );
}

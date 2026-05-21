/**
 * Login Screen.
 *
 * ⚠️  MOCK ONLY — there is NO authentication backend yet. This screen exists so
 * the sign-in step is present and demoable. Typing anything (or tapping any
 * social button, or "Sign up") simply proceeds — no credentials are checked,
 * stored, or sent anywhere.
 *
 * Real auth is a backend task: implement email/password + Google + LINE OAuth,
 * issue a session token, and wire `proceed()` below to a real sign-in call.
 * See BACKEND.md and IMPROVEMENTS.md ("Auth — open decision").
 */
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { MessageCircle } from 'lucide-react-native';

import { Button, Input, Text, cardShadow } from '@/src/components/ui';
import { SponsorBadge } from '@/src/components/shared';
import { useTranslation } from '@/src/hooks/useTranslation';
import { useUserStore } from '@/src/store';
import { hapticLight } from '@/src/lib/haptics';

/** The Google "G" mark (standard 4-colour logo). */
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  /**
   * MOCK sign-in. No real auth — route straight on. A returning user (profile
   * already exists) goes to Home; a new user goes to Onboarding.
   */
  const proceed = () => {
    hapticLight();
    router.replace(profile ? '/(tabs)/home' : '/onboarding');
  };

  return (
    <View className="flex-1 bg-navy">
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Brand */}
        <View className="mb-6 items-center">
          <Text className="font-display text-[30px] text-primary">
            {t('common.appName')}
          </Text>
          <Text variant="body" className="mt-1 text-center text-light">
            {t('login.subtitle')}
          </Text>
        </View>

        {/* Card */}
        <View className="rounded-card bg-white p-6" style={cardShadow}>
          <Text variant="h1" className="mb-4 text-ink">
            {t('login.title')}
          </Text>

          <Input
            label={t('login.emailLabel')}
            placeholder={t('login.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            containerClassName="mb-3"
          />
          <Input
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            containerClassName="mb-4"
          />

          <Button
            label={t('login.loginCta')}
            variant="orange"
            size="lg"
            onPress={proceed}
          />

          {/* Divider */}
          <View className="my-4 flex-row items-center">
            <View className="h-px flex-1 bg-border" />
            <Text variant="caption" className="mx-3">
              {t('login.orDivider')}
            </Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          {/* Continue with Google */}
          <Pressable
            onPress={proceed}
            accessibilityRole="button"
            accessibilityLabel={t('login.google')}
            className="mb-3 h-12 flex-row items-center justify-center gap-2.5 rounded-button border border-border bg-white"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            <GoogleIcon size={18} />
            <Text variant="label" className="text-ink">
              {t('login.google')}
            </Text>
          </Pressable>

          {/* Continue with LINE */}
          <Pressable
            onPress={proceed}
            accessibilityRole="button"
            accessibilityLabel={t('login.line')}
            className="h-12 flex-row items-center justify-center gap-2.5 rounded-button"
            style={({ pressed }) => ({
              backgroundColor: '#06C755',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <MessageCircle size={18} color="#FFFFFF" fill="#FFFFFF" />
            <Text variant="label" className="text-white">
              {t('login.line')}
            </Text>
          </Pressable>

          {/* Sign up */}
          <View className="mt-4 flex-row justify-center">
            <Text variant="caption" className="text-slate">
              {t('login.noAccount')}{' '}
            </Text>
            <Pressable
              onPress={proceed}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('login.signUp')}
            >
              <Text variant="caption" className="text-primary">
                {t('login.signUp')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Mock-build disclaimer */}
        <Text variant="caption" className="mt-4 text-center text-slate">
          {t('login.mockNote')}
        </Text>

        {/* Sponsor */}
        <View className="mt-6 items-center">
          <SponsorBadge variant="plain" />
        </View>
      </ScrollView>
    </View>
  );
}

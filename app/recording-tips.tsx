/**
 * Recording Tips — a standalone help screen explaining how to record a great
 * clip for AI analysis.
 *
 * Route: /recording-tips (registered in the root Stack in app/_layout.tsx).
 */
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, Maximize, Smartphone, Sun } from 'lucide-react-native';
import { useTranslation } from '@/src/hooks/useTranslation';
import { AppHeader, ScreenContainer } from '@/src/components/shared';
import { Button, Card, Text } from '@/src/components/ui';
import { colors } from '@/src/theme';

/** One recorded tip entry. */
interface TipDef {
  icon: React.ReactNode;
  titleKey: string;
  bodyKey: string;
  iconBg: string;
}

const ICON_SIZE = 22;

export default function RecordingTipsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const tips: TipDef[] = [
    {
      icon: <Camera size={ICON_SIZE} color={colors.primary} />,
      titleKey: 'recordingTips.tip1Title',
      bodyKey: 'recordingTips.tip1Body',
      iconBg: colors.primaryTint,
    },
    {
      icon: <Maximize size={ICON_SIZE} color={colors.mintStrong} />,
      titleKey: 'recordingTips.tip2Title',
      bodyKey: 'recordingTips.tip2Body',
      iconBg: colors.mintTint,
    },
    {
      icon: <Sun size={ICON_SIZE} color={colors.scoreAmber} />,
      titleKey: 'recordingTips.tip3Title',
      bodyKey: 'recordingTips.tip3Body',
      iconBg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: <Smartphone size={ICON_SIZE} color={colors.orange} />,
      titleKey: 'recordingTips.tip4Title',
      bodyKey: 'recordingTips.tip4Body',
      iconBg: colors.orangeTint,
    },
  ];

  return (
    <ScreenContainer
      header={<AppHeader showBack title={t('recordingTips.title')} />}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* ── Intro ─────────────────────────────────────────────────────── */}
        <Text variant="body" className="text-ink-soft mb-5 leading-relaxed">
          {t('recordingTips.intro')}
        </Text>

        {/* ── Tip cards ─────────────────────────────────────────────────── */}
        {tips.map((tip, idx) => (
          <Card key={idx} className="mb-4">
            <View className="flex-row items-start gap-4">
              {/* Tinted icon circle */}
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: tip.iconBg,
                }}
              >
                {tip.icon}
              </View>

              {/* Text */}
              <View className="flex-1">
                <Text variant="bodyMedium" className="text-ink mb-1 font-semibold">
                  {t(tip.titleKey)}
                </Text>
                <Text variant="body" className="text-ink-soft leading-snug">
                  {t(tip.bodyKey)}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* ── Done button ───────────────────────────────────────────────── */}
        <View className="mt-2">
          <Button
            label={t('recordingTips.done')}
            variant="primary"
            size="lg"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

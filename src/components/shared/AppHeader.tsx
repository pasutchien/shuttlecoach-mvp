/**
 * AppHeader — the single shared screen header.
 *
 * Every titled screen routes through this component so the header FRAME
 * (height, vertical alignment, horizontal padding, background) is identical
 * app-wide. Only the CONTENT varies by prop: an optional back chevron, a
 * title, an optional title accessory, an optional trailing action, or a fully
 * custom leading slot (the Home logo lockup).
 *
 * Frame — a navy bar that bleeds under the status bar:
 *   total height  = safe-area top inset + `sizing.header` (56pt)
 *   content row   = fixed `sizing.header`, vertically centred
 *   side padding  = `spacing.screenX` (20pt)
 *
 * No screen may define its own header height, padding or safe-area handling.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Text } from '@/src/components/ui';
import { useTranslation } from '@/src/hooks/useTranslation';
import { colors, sizing, spacing } from '@/src/theme';

export interface AppHeaderProps {
  /** Title text. Omit when supplying a custom `leading` slot (e.g. Home). */
  title?: string;
  /**
   * Show the back chevron at the leading edge. Use ONLY on pushed screens
   * (Transaction History, Analysis) — never on top-level tab roots.
   */
  showBack?: boolean;
  /** Custom back handler. Defaults to `router.back()`. */
  onBack?: () => void;
  /** Node rendered immediately after the title (e.g. a count badge). */
  titleAccessory?: ReactNode;
  /** Trailing action slot (sort button, credit chip, share icon, …). */
  right?: ReactNode;
  /** Custom leading content that replaces the title (e.g. the Home logo). */
  leading?: ReactNode;
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  titleAccessory,
  right,
  leading,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View className="bg-navy" style={{ paddingTop: insets.top }}>
      <View
        className="flex-row items-center"
        style={{ height: sizing.header, paddingHorizontal: spacing.screenX }}
      >
        {/* Leading — back chevron (pushed screens only). The 44pt touch
            target is nudged left so the chevron sits on the 20pt grid. */}
        {showBack ? (
          <Pressable
            onPress={onBack ?? (() => router.back())}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            className="-ml-2 mr-1 h-11 w-11 items-center justify-center"
          >
            <ChevronLeft size={24} color={colors.white} />
          </Pressable>
        ) : null}

        {/* Title / custom leading content */}
        {leading ? (
          <View className="flex-1 flex-row items-center">{leading}</View>
        ) : (
          <View className="flex-1 flex-row items-center">
            {title ? (
              <Text
                variant="h1"
                numberOfLines={1}
                className="text-white text-[20px]"
                accessibilityRole="header"
              >
                {title}
              </Text>
            ) : null}
            {titleAccessory ? (
              <View className="ml-3">{titleAccessory}</View>
            ) : null}
          </View>
        )}

        {/* Trailing action slot */}
        {right ? <View className="ml-3">{right}</View> : null}
      </View>
    </View>
  );
}

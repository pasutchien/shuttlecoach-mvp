/**
 * ScreenContainer — the single shared screen scaffold.
 *
 * Wraps every screen so the screen background and the header frame are
 * identical app-wide. Pass an <AppHeader/> via the `header` prop; the body
 * (children) renders directly below it and fills the remaining space.
 *
 * Body horizontal padding is the standard `spacing.screenX` (20pt): set
 * `padded` for a static body, or apply `spacing.screenX` on the
 * contentContainerStyle of a ScrollView / FlatList body.
 *
 * The header owns the top safe-area inset (see AppHeader). The bottom
 * safe-area inset belongs to scrolling content (contentContainerStyle) since
 * ScreenContainer does not assume its body scrolls.
 */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { spacing } from '@/src/theme';

type ScreenBackground = 'light' | 'navy' | 'white';

/** Maps the semantic background name to its NativeWind class. */
const BG_CLASS: Record<ScreenBackground, string> = {
  light: 'bg-light',
  navy: 'bg-navy',
  white: 'bg-white',
};

export interface ScreenContainerProps {
  children: ReactNode;
  /** An <AppHeader/> element. Omit for headerless screens (splash, processing). */
  header?: ReactNode;
  /** Screen background colour. Defaults to the light app background. */
  background?: ScreenBackground;
  /** Apply the standard 20pt horizontal padding to a static (non-scroll) body. */
  padded?: boolean;
}

export function ScreenContainer({
  children,
  header,
  background = 'light',
  padded = false,
}: ScreenContainerProps) {
  return (
    <View className={`flex-1 ${BG_CLASS[background]}`}>
      {header}
      {padded ? (
        <View
          className="flex-1"
          style={{ paddingHorizontal: spacing.screenX }}
        >
          {children}
        </View>
      ) : (
        children
      )}
    </View>
  );
}

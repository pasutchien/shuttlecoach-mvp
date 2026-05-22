/**
 * Shuttle Coach logo mark — a minimal mark abstracted from a shuttlecock.
 *
 * Four variants share one stroke language (round-capped strokes, the navy
 * brand surface, electric-blue accent) so they read as a consistent family:
 *  - 'caret'   — a single clean chevron (^)
 *  - 'stacked' — two stacked chevrons, layered like a shuttlecock's feathers
 *  - 'shuttle' — a chevron of feathers above a mint cork dot
 *  - 'fan'     — three feather strokes splaying up from a single point
 */
import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/src/theme/colors';

export type LogoVariant = 'caret' | 'stacked' | 'shuttle' | 'fan';

export interface LogoProps {
  size?: number;
  /** Which mark to render. Defaults to the single chevron. */
  variant?: LogoVariant;
  /** Stroke color of the mark. Defaults to the electric-blue brand accent. */
  color?: string;
}

export function Logo({
  size = 96,
  variant = 'caret',
  color = colors.primary,
}: LogoProps) {
  const stroke = {
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* A — a single upward chevron. */}
      {variant === 'caret' && (
        <Path d="M10 43 L32 21 L54 43" strokeWidth={9} {...stroke} />
      )}

      {/* B — two stacked chevrons, layered like feathers. */}
      {variant === 'stacked' && (
        <>
          <Path d="M14 31 L32 15 L50 31" strokeWidth={8} {...stroke} />
          <Path d="M10 47 L32 29 L54 47" strokeWidth={8} {...stroke} />
        </>
      )}

      {/* C — a chevron of feathers above a mint cork dot. */}
      {variant === 'shuttle' && (
        <>
          <Path d="M12 35 L32 15 L52 35" strokeWidth={9} {...stroke} />
          <Circle cx={32} cy={49} r={7} fill={colors.mint} />
        </>
      )}

      {/* D — three feather strokes splaying up from one point. */}
      {variant === 'fan' && (
        <>
          <Path d="M32 47 L17 18" strokeWidth={7} {...stroke} />
          <Path d="M32 47 L32 12" strokeWidth={7} {...stroke} />
          <Path d="M32 47 L47 18" strokeWidth={7} {...stroke} />
        </>
      )}
    </Svg>
  );
}

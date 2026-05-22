/**
 * Shuttle Coach logo mark — a minimal shuttlecock: a white feather cone with
 * an electric-blue cork. Designed to read cleanly on the navy brand surface.
 */
import Svg, { Circle, Line, Path } from 'react-native-svg';

export interface LogoProps {
  size?: number;
}

export function Logo({ size = 96 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Feather skirt — filled cone with a softly curved rim */}
      <Path d="M32 43 L12 17 Q32 7 52 17 Z" fill="#FFFFFF" />
      {/* Feather divisions */}
      <Line x1="32" y1="43" x2="21" y2="13" stroke="#0A1628" strokeWidth="1.5" />
      <Line x1="32" y1="43" x2="32" y2="9" stroke="#0A1628" strokeWidth="1.5" />
      <Line x1="32" y1="43" x2="43" y2="13" stroke="#0A1628" strokeWidth="1.5" />
      {/* Cork */}
      <Circle
        cx="32"
        cy="48"
        r="9"
        fill="#2563EB"
        stroke="#FFFFFF"
        strokeWidth="2.5"
      />
    </Svg>
  );
}

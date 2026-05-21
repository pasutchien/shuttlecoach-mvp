/**
 * Stroke icons (SPEC §5.5) — a clean line-art shot trajectory per stroke:
 * a smooth path with a hollow "start" ring and a filled "shuttle" dot at the
 * end. Minimal and unambiguous, drawn in a 0–48 viewBox.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import type { StrokeType } from '@/src/types';
import { colors } from '@/src/theme';

export interface StrokeIconProps {
  stroke: StrokeType;
  size?: number;
  color?: string;
}

/** [curve, startPoint, endPoint] per stroke. */
const SHOT: Record<
  StrokeType,
  { d: string; start: [number, number]; end: [number, number] }
> = {
  // Steep, powerful downward smash.
  Smash: { d: 'M9 9 Q 26 16 37 39', start: [9, 9], end: [37, 39] },
  // Soft arc tumbling just over the net.
  Drop_Shot: { d: 'M9 31 Q 17 11 26 27', start: [9, 31], end: [26, 27] },
  // High, deep clear to the back court.
  Clear: { d: 'M7 38 Q 24 1 41 31', start: [7, 38], end: [41, 31] },
  // Flat, fast drive parallel to the floor.
  Drive: { d: 'M8 23 Q 23 20 39 21', start: [8, 23], end: [39, 21] },
  // Short, sharp downward kill at the net.
  Net_Kill: { d: 'M14 11 Q 21 18 31 30', start: [14, 11], end: [31, 30] },
};

export function StrokeIcon({
  stroke,
  size = 40,
  color = colors.primary,
}: StrokeIconProps) {
  const shot = SHOT[stroke];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Trajectory */}
      <Path
        d={shot.d}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        fill="none"
      />
      {/* Hit point — hollow ring */}
      <Circle
        cx={shot.start[0]}
        cy={shot.start[1]}
        r={3.4}
        stroke={color}
        strokeWidth={2.2}
        fill="#FFFFFF"
      />
      {/* Shuttle — filled dot */}
      <Circle cx={shot.end[0]} cy={shot.end[1]} r={4.4} fill={color} />
    </Svg>
  );
}

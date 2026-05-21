/**
 * Custom line-art stroke icons (SPEC §5.5). Each icon draws a shuttlecock plus
 * a trajectory characteristic of the stroke. 40×40pt by default.
 */
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { StrokeType } from '@/src/types';
import { colors } from '@/src/theme';

export interface StrokeIconProps {
  stroke: StrokeType;
  size?: number;
  color?: string;
}

/** Trajectory path per stroke, drawn in a 0–40 viewBox. */
const TRAJECTORY: Record<StrokeType, string> = {
  // Steep downward smash.
  Smash: 'M6 6 C 16 10, 24 18, 33 34',
  // Gentle arc that drops near the net.
  Drop_Shot: 'M6 22 C 14 8, 22 8, 33 30',
  // High, deep clear.
  Clear: 'M5 32 C 14 4, 26 4, 35 26',
  // Flat, fast drive.
  Drive: 'M5 21 L 33 19',
  // Short, sharp downward kill.
  Net_Kill: 'M10 10 L 28 30',
};

export function StrokeIcon({
  stroke,
  size = 40,
  color = colors.primary,
}: StrokeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Trajectory */}
      <Path
        d={TRAJECTORY[stroke]}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="1 3.5"
        opacity={0.55}
      />
      {/* Shuttlecock — cork at the trajectory end-ish, feathers fanning out */}
      <Circle cx={31} cy={32} r={3.4} fill={color} />
      <Line x1={31} y1={32} x2={26} y2={25} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={31} y1={32} x2={30} y2={23} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={31} y1={32} x2={34} y2={24} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={26} y1={25} x2={34} y2={24} stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

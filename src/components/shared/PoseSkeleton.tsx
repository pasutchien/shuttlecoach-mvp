/**
 * Pose-skeleton stick figure for the S8 processing screen — a stylised player
 * mid-smash, drawn with joint dots like a CV pose estimate. The S8 screen
 * gives it a subtle breathing animation.
 */
import Svg, { Circle, Line } from 'react-native-svg';
import { colors } from '@/src/theme';

export interface PoseSkeletonProps {
  size?: number;
  color?: string;
  jointColor?: string;
}

export function PoseSkeleton({
  size = 120,
  color = '#FFFFFF',
  jointColor = colors.mint,
}: PoseSkeletonProps) {
  // Joint coordinates in a 0–100 viewBox (player in a smash pose).
  const head = { x: 52, y: 16 };
  const neck = { x: 50, y: 28 };
  const hip = { x: 47, y: 58 };
  const shoulderR = { x: 58, y: 30 };
  const elbowR = { x: 70, y: 18 };
  const handR = { x: 78, y: 6 };
  const shoulderL = { x: 42, y: 32 };
  const elbowL = { x: 32, y: 44 };
  const handL = { x: 28, y: 56 };
  const kneeR = { x: 56, y: 78 };
  const footR = { x: 60, y: 96 };
  const kneeL = { x: 38, y: 78 };
  const footL = { x: 32, y: 96 };

  const bones: [typeof neck, typeof neck][] = [
    [neck, hip],
    [neck, shoulderR],
    [shoulderR, elbowR],
    [elbowR, handR],
    [neck, shoulderL],
    [shoulderL, elbowL],
    [elbowL, handL],
    [hip, kneeR],
    [kneeR, footR],
    [hip, kneeL],
    [kneeL, footL],
  ];
  const joints = [
    neck,
    hip,
    shoulderR,
    elbowR,
    handR,
    shoulderL,
    elbowL,
    handL,
    kneeR,
    footR,
    kneeL,
    footL,
  ];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx={head.x} cy={head.y} r={9} stroke={color} strokeWidth={3} />
      {bones.map(([a, b], i) => (
        <Line
          key={i}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      {joints.map((j, i) => (
        <Circle key={i} cx={j.x} cy={j.y} r={3.4} fill={jointColor} />
      ))}
    </Svg>
  );
}

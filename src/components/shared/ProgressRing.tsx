/**
 * Circular progress ring (SPEC §4 S8). Fills 0→1; renders children centred
 * (e.g. the animated pose skeleton).
 */
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@/src/theme';
import { cn } from '@/src/lib/cn';

export interface ProgressRingProps {
  /** 0–1 completion. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 220,
  strokeWidth = 10,
  color = colors.mint,
  trackColor = 'rgba(255,255,255,0.12)',
  children,
  className,
}: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const offset = circ * (1 - clamped);

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

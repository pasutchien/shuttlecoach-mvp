/**
 * Score circle (SPEC §4 S9). Circular ring + 0–100 number, colour-coded
 * (green ≥80 / amber 50–79 / red <50). When `animated`, the number counts up
 * from 0 over 1.2s with an ease-out curve — the S9 delight moment. Respects
 * Reduce Motion.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { scoreColorHex } from '@/src/lib/score';
import { colors } from '@/src/theme';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { Text } from '@/src/components/ui';
import { cn } from '@/src/lib/cn';

export interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  /** Count the number up from 0 over 1.2s (S9 hero use). */
  animated?: boolean;
  /** Optional caption under the number. */
  label?: string;
  className?: string;
}

export function ScoreCircle({
  score,
  size = 120,
  strokeWidth = 8,
  animated = false,
  label,
  className,
}: ScoreCircleProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(animated && !reduced ? 0 : score);

  useEffect(() => {
    if (!animated || reduced) {
      setDisplay(score);
      return;
    }
    const duration = 1200;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animated, reduced]);

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const hex = scoreColorHex(score);
  const offset = circ * (1 - display / 100);

  return (
    <View
      className={cn('items-center justify-center', className)}
      style={{ width: size, height: size }}
      accessibilityLabel={`Score ${score} out of 100`}
    >
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.light}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={hex}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        className="font-display text-ink"
        style={{
          fontSize: size * 0.32,
          color: hex,
          fontVariant: ['tabular-nums'],
          letterSpacing: -0.5,
        }}
      >
        {display}
      </Text>
      {label ? (
        <Text variant="caption" className="mt-0.5" style={{ color: hex }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

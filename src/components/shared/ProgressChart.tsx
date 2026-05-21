/**
 * Lightweight SVG line chart for the score trend (SPEC §10). Self-contained —
 * no chart dependency — so it renders identically on native and web export.
 */
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Text } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { scoreColorHex } from '@/src/lib/score';
import { cn } from '@/src/lib/cn';

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ProgressChartProps {
  points: ChartPoint[];
  height?: number;
  className?: string;
}

export function ProgressChart({
  points,
  height = 140,
  className,
}: ProgressChartProps) {
  const [width, setWidth] = useState(0);
  const padX = 14;
  const padY = 18;

  if (points.length < 2) {
    return (
      <View
        className={cn('items-center justify-center', className)}
        style={{ height }}
      >
        <Text variant="caption">—</Text>
      </View>
    );
  }

  const innerW = Math.max(0, width - padX * 2);
  const innerH = height - padY * 2;
  const max = 100;
  const min = 0;

  const coords = points.map((p, i) => {
    const x = padX + (innerW * i) / (points.length - 1);
    const y = padY + innerH * (1 - (p.value - min) / (max - min));
    return { x, y, value: p.value, label: p.label };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <View
      className={cn('w-full', className)}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* baseline + midline */}
          <Polyline
            points={`${padX},${padY + innerH} ${padX + innerW},${padY + innerH}`}
            stroke={colors.light}
            strokeWidth={1}
          />
          <Polyline
            points={`${padX},${padY + innerH / 2} ${padX + innerW},${padY + innerH / 2}`}
            stroke={colors.light}
            strokeWidth={1}
          />
          <Polyline
            points={polyline}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {coords.map((c, i) => (
            <Circle
              key={i}
              cx={c.x}
              cy={c.y}
              r={4}
              fill={scoreColorHex(c.value)}
              stroke={colors.white}
              strokeWidth={1.5}
            />
          ))}
        </Svg>
      ) : null}
      {/* X labels */}
      <View className="mt-1 flex-row justify-between px-1">
        {points.map((p, i) => (
          <Text key={`${p.label}-${i}`} variant="caption" className="text-[10px]">
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

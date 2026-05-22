/**
 * Radar / spider chart for the 7 stroke checkpoints (SPEC §8.1).
 *
 * A premium, screenshot-friendly way to read a multi-axis breakdown at a
 * glance — the weakest checkpoint is instantly visible. Self-contained SVG,
 * no chart dependency.
 */
import { View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { colors } from '@/src/theme';
import { cn } from '@/src/lib/cn';

export interface RadarPoint {
  label: string;
  /** 0–100. */
  value: number;
}

export interface RadarChartProps {
  points: RadarPoint[];
  size?: number;
  className?: string;
}

export function RadarChart({ points, size = 280, className }: RadarChartProps) {
  const n = points.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 40; // leave room for labels

  // Vertex angle for index i — start at the top, go clockwise.
  const angle = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
  const at = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  const rings = [0.34, 0.67, 1];
  const dataPoints = points
    .map((p, i) => {
      const pt = at(i, (Math.max(0, Math.min(100, p.value)) / 100) * r);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');

  return (
    <View className={cn('items-center', className)}>
      <Svg width={size} height={size}>
        {/* Grid rings (heptagons) */}
        {rings.map((ring, ri) => (
          <Polygon
            key={ri}
            points={points
              .map((_, i) => {
                const pt = at(i, r * ring);
                return `${pt.x},${pt.y}`;
              })
              .join(' ')}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Axis spokes */}
        {points.map((_, i) => {
          const end = at(i, r);
          return (
            <Line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPoints}
          fill="rgba(37,99,235,0.18)"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Data vertices */}
        {points.map((p, i) => {
          const pt = at(i, (Math.max(0, Math.min(100, p.value)) / 100) * r);
          return (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill={colors.primary}
              stroke={colors.white}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Axis labels */}
        {points.map((p, i) => {
          const pt = at(i, r + 18);
          const a = angle(i);
          const anchor =
            Math.abs(Math.cos(a)) < 0.4
              ? 'middle'
              : Math.cos(a) > 0
                ? 'start'
                : 'end';
          return (
            <SvgText
              key={i}
              x={pt.x}
              y={pt.y + 4}
              fontSize={10}
              fontFamily="Inter_500Medium"
              fill={colors.inkSoft}
              textAnchor={anchor}
            >
              {p.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

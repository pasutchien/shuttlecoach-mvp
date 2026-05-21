/**
 * Single-thumb slider (SPEC §11.2). PanResponder-based so it works identically
 * on native and web. Supports continuous or stepped values.
 */
import { useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { cn } from '@/src/lib/cn';

const THUMB = 24;
const TRACK = 4;

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Snap increment; omit for continuous. */
  step?: number;
  /** Tick marks rendered along the track. */
  marks?: boolean;
  /** Accessibility label announced by VoiceOver/TalkBack. */
  accessibilityLabel?: string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step,
  marks = false,
  accessibilityLabel,
  className,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const usable = Math.max(0, width - THUMB);

  const clampSnap = (raw: number) => {
    let v = Math.max(min, Math.min(max, raw));
    if (step) v = Math.round((v - min) / step) * step + min;
    return v;
  };

  const fromGesture = (locationX: number) => {
    const w = widthRef.current - THUMB;
    if (w <= 0) return min;
    const ratio = Math.max(0, Math.min(1, (locationX - THUMB / 2) / w));
    return clampSnap(min + ratio * (max - min));
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => onChange(fromGesture(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => onChange(fromGesture(e.nativeEvent.locationX)),
    }),
  ).current;

  const ratio = max === min ? 0 : (value - min) / (max - min);
  const thumbLeft = ratio * usable;

  const tickCount = step ? Math.round((max - min) / step) + 1 : 0;

  return (
    <View
      className={cn('h-9 justify-center', className)}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setWidth(w);
        widthRef.current = w;
      }}
      {...responder.panHandlers}
    >
      {/* Track */}
      <View
        className="rounded-full bg-border"
        style={{ height: TRACK, marginHorizontal: THUMB / 2 }}
      />
      {/* Filled track */}
      <View
        className="absolute rounded-full bg-primary"
        style={{
          height: TRACK,
          left: THUMB / 2,
          width: Math.max(0, thumbLeft),
        }}
      />
      {/* Marks */}
      {marks && tickCount > 0
        ? Array.from({ length: tickCount }).map((_, i) => (
            <View
              key={i}
              className="absolute h-2 w-2 rounded-full bg-white border border-border"
              style={{
                left: THUMB / 2 - 4 + (usable * i) / (tickCount - 1),
              }}
            />
          ))
        : null}
      {/* Thumb */}
      <View
        className="absolute rounded-full bg-primary border-2 border-white"
        style={{
          width: THUMB,
          height: THUMB,
          left: thumbLeft,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </View>
  );
}

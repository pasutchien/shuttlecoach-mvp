/**
 * Stylised video thumbnail. Real frame extraction is out of scope for the MVP
 * (SPEC §7) — this renders a branded navy tile with the stroke glyph, used by
 * the Home and History analysis cards.
 */
import { View } from 'react-native';
import { Play } from 'lucide-react-native';
import type { StrokeType } from '@/src/types';
import { StrokeIcon } from './StrokeIcon';
import { cn } from '@/src/lib/cn';

export interface VideoThumbnailProps {
  stroke?: StrokeType;
  /** Tailwind size/rounding classes for the outer tile. */
  className?: string;
  showPlay?: boolean;
}

export function VideoThumbnail({
  stroke,
  className,
  showPlay = true,
}: VideoThumbnailProps) {
  return (
    <View
      className={cn(
        'items-center justify-center overflow-hidden bg-navy',
        className,
      )}
    >
      {/* Soft accent glow */}
      <View className="absolute h-20 w-20 rounded-full bg-primary/20" />
      {stroke ? (
        <View className="opacity-80">
          <StrokeIcon stroke={stroke} size={44} color="#FFFFFF" />
        </View>
      ) : null}
      {showPlay ? (
        <View className="absolute bottom-2 right-2 h-6 w-6 items-center justify-center rounded-full bg-white/90">
          <Play size={12} color="#0A1628" fill="#0A1628" />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Initials avatar with an auto-derived, stable background colour (SPEC S14).
 */
import { View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { Text } from './Text';

const PALETTE = ['#2563EB', '#E84A30', '#00C896', '#F59E0B', '#8B5CF6', '#0EA5E9'];

/** Pick a deterministic colour from a name. */
export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

/** First letters of the first two words. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: number;
  /** Override the auto colour. */
  color?: string;
  className?: string;
}

export function Avatar({ name, size = 44, color, className }: AvatarProps) {
  const bg = color ?? avatarColor(name);
  return (
    <View
      className={cn('items-center justify-center rounded-full', className)}
      style={{ width: size, height: size, backgroundColor: bg }}
      accessibilityLabel={name}
    >
      <Text
        className="font-display text-white"
        style={{ fontSize: size * 0.38 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

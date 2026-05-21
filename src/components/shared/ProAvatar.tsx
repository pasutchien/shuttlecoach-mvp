/**
 * Pro Player avatar — initials avatar tinted with the player's accent colour,
 * optionally with name + nationality alongside.
 */
import { View } from 'react-native';
import type { ProPlayer } from '@/src/types';
import { PRO_ACCENT } from '@/src/constants/proPlayers';
import { Avatar, Text } from '@/src/components/ui';
import { cn } from '@/src/lib/cn';

export interface ProAvatarProps {
  player: ProPlayer;
  size?: number;
  /** Show the player's name (and nationality) next to the avatar. */
  showName?: boolean;
  /** Show nationality under the name. */
  showNationality?: boolean;
  className?: string;
}

export function ProAvatar({
  player,
  size = 32,
  showName = false,
  showNationality = false,
  className,
}: ProAvatarProps) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      <Avatar
        name={player.name}
        size={size}
        color={PRO_ACCENT[player.id]}
      />
      {showName ? (
        <View className="flex-shrink">
          <Text variant="label" className="text-[13px]" numberOfLines={1}>
            {player.name}
          </Text>
          {showNationality ? (
            <Text variant="caption" numberOfLines={1}>
              {player.nationality} · {player.heightCm} cm
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

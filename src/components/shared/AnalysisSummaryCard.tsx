/**
 * Analysis Summary Card (SPEC §4 S3, §11.3) — the horizontally-scrolling card
 * on the Home screen.
 */
import { View } from 'react-native';
import type { Analysis } from '@/src/types';
import { getProPlayer } from '@/src/constants/proPlayers';
import { scoreColorHex } from '@/src/lib/score';
import { formatRelativeDate } from '@/src/lib/format';
import { useTranslation } from '@/src/hooks/useTranslation';
import { Card, Text } from '@/src/components/ui';
import { VideoThumbnail } from './VideoThumbnail';
import { ProAvatar } from './ProAvatar';

export interface AnalysisSummaryCardProps {
  analysis: Analysis;
  onPress: () => void;
}

export function AnalysisSummaryCard({
  analysis,
  onPress,
}: AnalysisSummaryCardProps) {
  const { t, locale } = useTranslation();
  const pro = getProPlayer(analysis.proPlayerId);

  return (
    <Card
      noPadding
      onPress={onPress}
      accessibilityLabel={`${t(`stroke.${analysis.strokeType}`)}, ${t(
        'analysis.shareScore',
      )} ${analysis.overallScore}`}
      className="w-[170px] overflow-hidden"
    >
      <View className="relative">
        <VideoThumbnail
          stroke={analysis.strokeType}
          className="h-[96px] w-full"
          showPlay={false}
        />
        {/* Stroke-type pill over the thumbnail */}
        <View className="absolute left-2 top-2 rounded-chip bg-black/55 px-2 py-1">
          <Text variant="label" className="text-[11px] text-white">
            {t(`stroke.${analysis.strokeType}`)}
          </Text>
        </View>
      </View>

      <View className="p-3">
        <Text variant="caption">
          {formatRelativeDate(analysis.createdAt, locale)}
        </Text>
        <Text
          className="font-display text-[28px]"
          style={{ color: scoreColorHex(analysis.overallScore) }}
        >
          {analysis.overallScore}
        </Text>
        {pro ? <ProAvatar player={pro} size={20} showName className="mt-1" /> : null}
      </View>
    </Card>
  );
}

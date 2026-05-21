/**
 * Analysis History Card (SPEC §4 S13, §11.3) — full-width horizontal row with
 * an optional progress delta vs. the previous analysis of the same stroke.
 */
import { View } from 'react-native';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import type { Analysis } from '@/src/types';
import { getProPlayer } from '@/src/constants/proPlayers';
import { formatRelativeDate } from '@/src/lib/format';
import { useTranslation } from '@/src/hooks/useTranslation';
import { colors } from '@/src/theme';
import { Card, Text } from '@/src/components/ui';
import { ScoreCircle } from './ScoreCircle';
import { VideoThumbnail } from './VideoThumbnail';

export interface AnalysisHistoryCardProps {
  analysis: Analysis;
  /** Signed point delta vs. the previous same-stroke analysis, if any. */
  delta?: number;
  onPress: () => void;
}

export function AnalysisHistoryCard({
  analysis,
  delta,
  onPress,
}: AnalysisHistoryCardProps) {
  const { t, locale } = useTranslation();
  const pro = getProPlayer(analysis.proPlayerId);
  const hasDelta = delta !== undefined && delta !== 0;
  const positive = (delta ?? 0) > 0;
  const deltaPoints = Math.abs(delta ?? 0);

  return (
    <Card
      noPadding
      onPress={onPress}
      accessibilityLabel={`${t(`stroke.${analysis.strokeType}`)}, ${t(
        'analysis.shareScore',
      )} ${analysis.overallScore}`}
      className="mb-3 flex-row p-3"
    >
      <VideoThumbnail
        stroke={analysis.strokeType}
        className="h-[80px] w-[80px] rounded-input"
        showPlay={false}
      />
      <View className="ml-3 flex-1 justify-center">
        <Text variant="h2" className="text-[16px]">
          {t(`stroke.${analysis.strokeType}`)}
        </Text>
        <Text variant="caption" className="mt-0.5">
          {formatRelativeDate(analysis.createdAt, locale)}
          {pro ? ` · ${pro.name}` : ''}
        </Text>
        {hasDelta ? (
          <View className="mt-1 flex-row items-center gap-1">
            {positive ? (
              <TrendingUp size={13} color={colors.scoreGreen} />
            ) : (
              <TrendingDown size={13} color={colors.scoreRed} />
            )}
            <Text
              variant="caption"
              style={{ color: positive ? colors.scoreGreen : colors.scoreRed }}
            >
              {t(positive ? 'history.progressUp' : 'history.progressDown', {
                points: deltaPoints,
                stroke: t(`stroke.${analysis.strokeType}`),
              })}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="justify-center pl-2">
        <ScoreCircle score={analysis.overallScore} size={48} strokeWidth={5} />
      </View>
    </Card>
  );
}

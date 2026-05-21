/**
 * Mistake Highlight Card (SPEC §4 S9, §11.3).
 *
 * Variable-height card with a 4pt severity-coloured left accent. Tapping the
 * card body jumps the videos to the mistake frame; the "How to Fix" button
 * opens the S10 drill sheet.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AlertOctagon, AlertTriangle, Info, Wrench } from 'lucide-react-native';
import type { MistakeCard, Severity } from '@/src/types';
import { Badge, Text, cardShadow, type BadgeTone } from '@/src/components/ui';
import { colors } from '@/src/theme';

const ACCENT: Record<Severity, string> = {
  Critical: colors.primary,
  Major: colors.scoreAmber,
  Minor: colors.border,
};

const TONE: Record<Severity, BadgeTone> = {
  Critical: 'primary',
  Major: 'warning',
  Minor: 'neutral',
};

const ICON = {
  Critical: AlertOctagon,
  Major: AlertTriangle,
  Minor: Info,
} as const;

export interface MistakeHighlightCardProps {
  mistake: MistakeCard;
  severityLabel: string;
  howToFixLabel: string;
  readMoreLabel: string;
  readLessLabel: string;
  onPress: () => void;
  onHowToFix: () => void;
}

export function MistakeHighlightCard({
  mistake,
  severityLabel,
  howToFixLabel,
  readMoreLabel,
  readLessLabel,
  onPress,
  onHowToFix,
}: MistakeHighlightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON[mistake.severity];
  const longText = mistake.description.length > 90;

  return (
    <View
      style={cardShadow}
      className="mb-3 flex-row overflow-hidden rounded-card bg-white"
    >
      {/* Severity accent */}
      <View style={{ width: 4, backgroundColor: ACCENT[mistake.severity] }} />

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${mistake.title}. Jump to frame.`}
        className="flex-1 p-card"
      >
        <View className="flex-row items-start gap-2">
          <Icon size={18} color={ACCENT[mistake.severity]} />
          <Text variant="h2" className="flex-1 text-[16px] leading-[21px]">
            {mistake.title}
          </Text>
        </View>

        <Text
          variant="body"
          className="mt-1.5 text-slate"
          numberOfLines={expanded ? undefined : 2}
        >
          {mistake.description}
        </Text>
        {longText ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            hitSlop={8}
            className="mt-0.5"
          >
            <Text variant="caption" className="text-primary">
              {expanded ? readLessLabel : readMoreLabel}
            </Text>
          </Pressable>
        ) : null}

        <View className="mt-3 flex-row items-center justify-between">
          <Badge label={severityLabel} tone={TONE[mistake.severity]} />
          <Pressable
            onPress={onHowToFix}
            accessibilityRole="button"
            accessibilityLabel={howToFixLabel}
            className="flex-row items-center gap-1 rounded-input bg-tip-bg px-3 py-2"
          >
            <Wrench size={14} color={colors.primary} />
            <Text variant="label" className="text-[13px] text-primary">
              {howToFixLabel}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

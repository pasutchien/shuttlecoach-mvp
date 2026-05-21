/**
 * Themed on/off switch (SPEC S14 notification settings).
 */
import { Switch } from 'react-native';
import { colors } from '@/src/theme';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

export function Toggle({
  value,
  onValueChange,
  accessibilityLabel,
}: ToggleProps) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.border}
    />
  );
}

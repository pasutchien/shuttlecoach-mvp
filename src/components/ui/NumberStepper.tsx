/**
 * Number stepper — minus | value | plus (SPEC §11.2).
 */
import { Pressable, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/theme';
import { hapticSelection } from '@/src/lib/haptics';
import { Text } from './Text';

export interface NumberStepperProps {
  label?: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Unit shown after the value, e.g. "cm". */
  suffix?: string;
  className?: string;
}

export function NumberStepper({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  suffix,
  className,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const set = (next: number) => {
    hapticSelection();
    onChange(clamp(next));
  };

  return (
    <View className={cn('w-full', className)}>
      {label ? (
        <Text variant="caption" className="mb-1.5 text-slate">
          {label}
        </Text>
      ) : null}
      <View className="flex-row items-center justify-between">
        <StepButton
          onPress={() => set(value - step)}
          disabled={value - step < min}
          icon="minus"
        />
        <View className="flex-1 items-center">
          <Text className="font-display text-[24px] text-ink">
            {value}
            {suffix ? (
              <Text className="font-mono text-[14px] text-slate"> {suffix}</Text>
            ) : null}
          </Text>
        </View>
        <StepButton
          onPress={() => set(value + step)}
          disabled={value + step > max}
          icon="plus"
        />
      </View>
    </View>
  );
}

function StepButton({
  onPress,
  disabled,
  icon,
}: {
  onPress: () => void;
  disabled: boolean;
  icon: 'minus' | 'plus';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={icon === 'minus' ? 'Decrease' : 'Increase'}
      // 40pt control + 4pt slop each side → ≥44pt touch target (SPEC §5.4).
      hitSlop={4}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full border-2',
        disabled ? 'border-border' : 'border-primary',
      )}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {icon === 'minus' ? (
        <Minus size={20} color={disabled ? colors.border : colors.primary} />
      ) : (
        <Plus size={20} color={disabled ? colors.border : colors.primary} />
      )}
    </Pressable>
  );
}

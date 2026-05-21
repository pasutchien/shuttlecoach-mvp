/**
 * Step indicator for the S4–S7 upload flow (SPEC §4). Active = filled blue
 * circle, completed = mint check, upcoming = empty slate circle.
 */
import { Fragment } from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { Text } from '@/src/components/ui';
import { colors } from '@/src/theme';
import { cn } from '@/src/lib/cn';

export interface StepIndicatorProps {
  /** Short labels, in order. */
  steps: string[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
}

export function StepIndicator({
  steps,
  current,
  className,
}: StepIndicatorProps) {
  return (
    <View className={cn('flex-row items-center', className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={label}>
            <View className="items-center">
              <View
                className={cn(
                  'h-7 w-7 items-center justify-center rounded-full',
                  done && 'bg-mint',
                  active && 'bg-primary',
                  !done && !active && 'border border-border bg-white',
                )}
              >
                {done ? (
                  <Check size={14} color={colors.white} />
                ) : (
                  <Text
                    variant="label"
                    className={cn(
                      'text-[12px]',
                      active ? 'text-white' : 'text-slate',
                    )}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                variant="caption"
                className={cn(
                  'mt-1 text-[10px]',
                  active ? 'text-primary' : 'text-slate',
                )}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 ? (
              <View
                className={cn(
                  'mx-1 mb-4 h-0.5 flex-1',
                  i < current ? 'bg-mint' : 'bg-border',
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </View>
  );
}

/**
 * Segmented control (SPEC §11.2). Full-width, active segment = white + shadow.
 */
import { Pressable, View } from 'react-native';
import { cn } from '@/src/lib/cn';
import { hapticSelection } from '@/src/lib/haptics';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View
      className={cn(
        'h-10 flex-row rounded-input bg-slate/10 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => {
              hapticSelection();
              onChange(opt.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className="flex-1 items-center justify-center rounded-md"
            style={
              active
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : undefined
            }
          >
            <Text
              variant="label"
              className={cn(
                'text-[13px]',
                active ? 'text-ink' : 'text-slate',
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

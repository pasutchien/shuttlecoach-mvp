/**
 * Button primitive (SPEC §11.1). Covers primary/secondary/text/destructive
 * variants and the default / disabled / loading states.
 */
import { ActivityIndicator, Pressable, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/theme';
import { hapticLight } from '@/src/lib/haptics';
import { Text } from './Text';

const button = cva(
  'flex-row items-center justify-center rounded-button gap-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        orange: 'bg-orange',
        secondary: 'border-[1.5px] border-primary bg-transparent',
        destructive: 'bg-score-red',
        text: 'bg-transparent',
      },
      size: {
        lg: 'h-[56px] px-6', // full-width primary
        md: 'h-[48px] px-5', // secondary
        sm: 'h-11 px-4', // compact / inline
      },
      block: { true: 'w-full', false: 'self-start' },
    },
    defaultVariants: { variant: 'primary', size: 'lg', block: true },
  },
);

const LABEL_COLOR: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-white',
  orange: 'text-white',
  destructive: 'text-white',
  secondary: 'text-primary',
  text: 'text-primary',
};

export interface ButtonProps extends VariantProps<typeof button> {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Optional leading icon (e.g. a lucide icon element). */
  icon?: React.ReactNode;
  className?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  size = 'lg',
  block = true,
  className,
  testID,
}: ButtonProps) {
  const v = variant ?? 'primary';
  const isDisabled = disabled || loading;
  const isFilled = v === 'primary' || v === 'orange' || v === 'destructive';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={() => {
        hapticLight();
        onPress?.();
      }}
      className={cn(
        button({ variant, size, block }),
        // Disabled fill (SPEC §11.1): grey bg, muted text.
        isDisabled && isFilled && 'bg-border',
        isDisabled && !isFilled && 'opacity-40',
        className,
      )}
      style={({ pressed }) => ({
        opacity: pressed && !isDisabled ? 0.88 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator
          color={isFilled ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            variant="label"
            className={cn(
              'font-label',
              isDisabled ? 'text-placeholder' : LABEL_COLOR[v],
              size === 'lg' && 'text-[16px]',
            )}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

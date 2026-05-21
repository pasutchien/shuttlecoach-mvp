/**
 * Text input with label and optional error (SPEC §11.2).
 */
import { useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';
import { cn } from '@/src/lib/cn';
import { colors } from '@/src/theme';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  /** Inline error message shown below the field. */
  error?: string;
  /** Hint text shown below the field when there is no error. */
  hint?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  hint,
  containerClassName,
  className,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('w-full', containerClassName)}>
      {label ? (
        <Text variant="caption" className="mb-1.5 text-slate">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={cn(
          'h-12 rounded-input border bg-white px-3.5 font-body text-[15px] text-ink',
          focused ? 'border-2 border-primary' : 'border border-border',
          error && 'border-score-red',
          className,
        )}
        {...rest}
      />
      {error ? (
        <Text variant="caption" className="mt-1 text-score-red">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" className="mt-1 text-slate">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

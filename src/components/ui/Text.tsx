/**
 * Typed Text primitive. `variant` maps to the SPEC §5.3 type scale; never set a
 * raw fontFamily/fontSize in a screen — pick a variant.
 */
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/src/lib/cn';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'h1'
  | 'h2'
  | 'label'
  | 'body'
  | 'bodyMedium'
  | 'caption'
  | 'mono';

const VARIANT_CLASS: Record<TextVariant, string> = {
  hero: 'font-display text-[32px] leading-[38px] text-ink',
  display: 'font-display text-[28px] leading-[34px] text-ink',
  h1: 'font-heading-bold text-[24px] leading-[30px] text-ink',
  h2: 'font-heading-bold text-[20px] leading-[26px] text-ink',
  label: 'font-label text-[15px] leading-[20px] text-ink',
  body: 'font-body text-[14px] leading-[21px] text-ink',
  bodyMedium: 'font-body-medium text-[14px] leading-[21px] text-ink',
  caption: 'font-body text-[12px] leading-[16px] text-ink-soft',
  mono: 'font-mono text-[13px] leading-[18px] text-ink',
};

export interface TextComponentProps extends TextProps {
  variant?: TextVariant;
  className?: string;
}

export function Text({
  variant = 'body',
  className,
  ...rest
}: TextComponentProps) {
  return <RNText className={cn(VARIANT_CLASS[variant], className)} {...rest} />;
}

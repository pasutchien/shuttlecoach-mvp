/**
 * Translation hook. Subscribes to the settings store's `locale` so any screen
 * using `t()` re-renders when the language is switched in S14.
 */
import { useCallback } from 'react';
import { t as translate, type AppLocale } from '@/src/i18n';
import { useSettingsStore } from '@/src/store/settings';

export interface UseTranslation {
  t: (key: string, options?: Record<string, unknown>) => string;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

export function useTranslation(): UseTranslation {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  // `locale` is captured so the callback identity changes on a language switch.
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => {
      void locale;
      return translate(key, options);
    },
    [locale],
  );

  return { t, locale, setLocale };
}

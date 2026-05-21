/**
 * i18n setup — Thai (primary) + English (SPEC §8, §9.2).
 *
 * `i18n-js` itself is not reactive; the active locale also lives in the settings
 * store (`src/store/settings.ts`). Screens read `locale` from that store so a
 * language switch triggers a re-render, while `t()` reads the value here.
 */
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';

import en from './en.json';
import th from './th.json';

export type AppLocale = 'th' | 'en';

export const i18n = new I18n({ en, th });
i18n.enableFallback = true;
i18n.defaultLocale = 'th';

/** Device language if supported, otherwise the Thai default (SPEC §8). */
export function resolveInitialLocale(): AppLocale {
  const lang = getLocales()[0]?.languageCode;
  return lang === 'en' ? 'en' : 'th';
}

i18n.locale = resolveInitialLocale();

/** Translate a key. Supports `{{placeholder}}` interpolation. */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/** Switch the active locale. Callers should also update the settings store. */
export function applyLocale(locale: AppLocale): void {
  i18n.locale = locale;
}

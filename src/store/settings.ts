/**
 * App settings store — locale (persisted to AsyncStorage).
 *
 * Note: this deliberately does NOT use zustand's `persist` middleware. Importing
 * `zustand/middleware` also pulls in the `devtools` middleware, whose code
 * contains `import.meta.env` — which Metro leaves untransformed in the web
 * bundle and crashes it ("Cannot use 'import.meta' outside a module"). Manual
 * AsyncStorage persistence keeps the web build working.
 *
 * `i18n-js` is not reactive, so the locale is mirrored here; screens read
 * `locale` to re-render on a switch.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyLocale, resolveInitialLocale, type AppLocale } from '@/src/i18n';

const STORAGE_KEY = 'shuttlecoach.settings.locale';

interface SettingsState {
  locale: AppLocale;
  /** True once the persisted locale has been loaded. */
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
  /** Load the persisted locale (called once at app start). */
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: resolveInitialLocale(),
  hydrated: false,

  setLocale: (locale) => {
    applyLocale(locale);
    set({ locale });
    void AsyncStorage.setItem(STORAGE_KEY, locale);
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'th' || saved === 'en') {
        applyLocale(saved);
        set({ locale: saved });
      }
    } catch {
      // Persistence is best-effort; fall back to the device locale.
    } finally {
      set({ hydrated: true });
    }
  },
}));

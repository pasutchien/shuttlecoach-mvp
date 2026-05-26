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

const STORAGE_KEY_LOCALE = 'shuttlecoach.settings.locale';
const STORAGE_KEY_USER_ID = 'shuttlecoach.settings.userId';

interface SettingsState {
  locale: AppLocale;
  userId: string | null;
  /** True once the persisted settings have been loaded. */
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
  setUserId: (id: string) => void;
  /** Load persisted settings (called once at app start). */
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: resolveInitialLocale(),
  userId: null,
  hydrated: false,

  setLocale: (locale) => {
    applyLocale(locale);
    set({ locale });
    void AsyncStorage.setItem(STORAGE_KEY_LOCALE, locale);
  },

  setUserId: (id) => {
    set({ userId: id });
    void AsyncStorage.setItem(STORAGE_KEY_USER_ID, id);
  },

  hydrate: async () => {
    try {
      const [savedLocale, savedUserId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_LOCALE),
        AsyncStorage.getItem(STORAGE_KEY_USER_ID),
      ]);
      if (savedLocale === 'th' || savedLocale === 'en') {
        applyLocale(savedLocale);
        set({ locale: savedLocale });
      }
      if (savedUserId) set({ userId: savedUserId });
    } catch {
      // Persistence is best-effort; fall back to defaults.
    } finally {
      set({ hydrated: true });
    }
  },
}));

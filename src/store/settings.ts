/**
 * App settings store — locale (persisted). `i18n-js` is not reactive, so the
 * locale is mirrored here; screens read `locale` to re-render on a switch.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyLocale, resolveInitialLocale, type AppLocale } from '@/src/i18n';

interface SettingsState {
  locale: AppLocale;
  /** True once persisted settings have been rehydrated. */
  hydrated: boolean;
  setLocale: (locale: AppLocale) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: resolveInitialLocale(),
      hydrated: false,
      setLocale: (locale) => {
        applyLocale(locale);
        set({ locale });
      },
    }),
    {
      name: 'shuttlecoach.settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ locale: s.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) applyLocale(state.locale);
        useSettingsStore.setState({ hydrated: true });
      },
    },
  ),
);

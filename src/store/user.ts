/**
 * User store — profile state, onboarding and account lifecycle.
 */
import { create } from 'zustand';
import type { UserProfile } from '@/src/types';
import { api, type ProfileInput } from '@/src/services';
import { useCreditStore } from './credits';
import { useAnalysisStore } from './analyses';

interface UserState {
  profile: UserProfile | null;
  /** True once the initial profile fetch has resolved. */
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Complete onboarding: create the profile (grants 100 free Credits). */
  completeOnboarding: (input: ProfileInput) => Promise<void>;
  /** Patch the existing profile (S14 edits). */
  updateProfile: (patch: ProfileInput) => Promise<void>;
  /** Sign out — clears the session back to a brand-new user. */
  signOut: () => Promise<void>;
  /** Delete the account — same reset as sign out for the MVP. */
  deleteAccount: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const profile = await api.getUserProfile();
      set({ profile, hydrated: true });
    } catch {
      // No userId yet (first launch) or network error — proceed to login.
      set({ hydrated: true });
    }
  },

  completeOnboarding: async (input) => {
    const profile = await api.updateUserProfile(input);
    set({ profile });
    // The welcome gift was granted server-side — refresh the credit cache.
    await useCreditStore.getState().hydrate();
    await useAnalysisStore.getState().hydrate();
  },

  updateProfile: async (patch) => {
    const profile = await api.updateUserProfile(patch);
    set({ profile });
  },

  signOut: async () => {
    await api.signOut();
    set({ profile: null });
    useCreditStore.getState().reset();
    useAnalysisStore.getState().reset();
  },

  deleteAccount: async () => {
    await api.deleteAccount();
    set({ profile: null });
    useCreditStore.getState().reset();
    useAnalysisStore.getState().reset();
  },
}));

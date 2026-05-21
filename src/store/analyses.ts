/**
 * Analysis history store — a UI cache over the service layer's saved analyses.
 */
import { create } from 'zustand';
import type { Analysis } from '@/src/types';
import { api } from '@/src/services';

interface AnalysisState {
  analyses: Analysis[];
  loading: boolean;
  /** True once analyses have been loaded at least once. */
  hydrated: boolean;
  /** Load saved analyses from the backend. */
  hydrate: () => Promise<void>;
  /** Re-fetch (e.g. after a new analysis completes). */
  refresh: () => Promise<void>;
  /** Delete an analysis (SPEC S13 swipe-to-delete). */
  remove: (id: string) => Promise<void>;
  /** Clear local cache (sign out). */
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analyses: [],
  loading: false,
  hydrated: false,

  hydrate: async () => {
    set({ loading: true });
    const analyses = await api.listAnalyses();
    set({ analyses, loading: false, hydrated: true });
  },

  refresh: async () => {
    const analyses = await api.listAnalyses();
    set({ analyses });
  },

  remove: async (id) => {
    await api.deleteAnalysis(id);
    set((s) => ({ analyses: s.analyses.filter((a) => a.id !== id) }));
  },

  reset: () => set({ analyses: [], loading: false, hydrated: false }),
}));

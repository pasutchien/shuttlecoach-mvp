/** Store barrel + the app-startup hydration coordinator. */
import { useUserStore } from './user';
import { useCreditStore } from './credits';
import { useAnalysisStore } from './analyses';

export { useSettingsStore } from './settings';
export { useUserStore } from './user';
export { useCreditStore } from './credits';
export { useAnalysisStore } from './analyses';
export {
  useUploadStore,
  trimDuration,
  SAMPLE_CLIP_DURATION,
  TRIM_MIN_SEC,
  TRIM_MAX_SEC,
} from './upload';

/**
 * Load all backend-backed state at app start. Profile loads first; credits and
 * history only load when a profile exists (a fresh user has neither yet).
 */
export async function hydrateApp(): Promise<void> {
  await useUserStore.getState().hydrate();
  if (useUserStore.getState().profile) {
    await Promise.all([
      useCreditStore.getState().hydrate(),
      useAnalysisStore.getState().hydrate(),
    ]);
  }
}

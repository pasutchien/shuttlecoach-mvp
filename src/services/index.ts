/**
 * Service-layer entry point.
 *
 * The whole app imports `api` from here and nothing else — swapping the mock
 * for the real backend is a single env flag, no UI changes required.
 *
 *   EXPO_PUBLIC_USE_MOCK_API !== 'false'  → mock implementation (default)
 *   EXPO_PUBLIC_USE_MOCK_API === 'false'  → real implementation (stub)
 */
import type { ShuttleCoachApi } from './api';
import { mockApi } from './mock/mockApi';
import { realApi } from './real/realApi';

/** Whether the mock backend is active. */
export const USING_MOCK_API = process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false';

/** The single backend instance the app talks to. */
export const api: ShuttleCoachApi = USING_MOCK_API ? mockApi : realApi;

export { ApiError } from './api';
export type {
  ApiErrorCode,
  ProfileInput,
  PurchaseResult,
  RefundResult,
  ShuttleCoachApi,
} from './api';

// Dev-only helper used by Sign Out / Delete Account to reset the mock DB.
export { resetDb, SEED_MODE } from './mock/db';

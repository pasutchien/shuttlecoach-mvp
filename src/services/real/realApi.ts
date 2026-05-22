/**
 * ===========================================================================
 *  REAL BACKEND IMPLEMENTATION — STUB ONLY
 * ===========================================================================
 *
 * This file is intentionally NOT implemented. It marks the seam where a
 * backend developer wires the real CV/AI pipeline to the app.
 *
 * To implement:
 *   1. Replace each method below with a real HTTP call (use `fetch` HERE — and
 *      only here; UI code must never call `fetch` directly).
 *   2. Honour the exact request/response/error contract in BACKEND.md.
 *   3. Map transport/HTTP errors onto `ApiError` with the documented codes.
 *   4. Switch the app over by setting `EXPO_PUBLIC_USE_MOCK_API=false`.
 *
 * The mapping to the ShuttleIQ CV pipeline (video + stroke + 4 court corners →
 * pose analysis → pro match → scored result with phase-by-phase feedback) is
 * described in BACKEND.md.
 */
import type {
  Analysis,
  AnalysisRequest,
  AnalysisStatusResult,
  CreditPackage,
  Drill,
  ProPlayer,
  Transaction,
  UserProfile,
} from '@/src/types';
import {
  ApiError,
  type ProfileInput,
  type PurchaseResult,
  type RefundResult,
  type ShuttleCoachApi,
} from '../api';

/** Base URL for the real API — supply via `EXPO_PUBLIC_API_BASE_URL`. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const notImplemented = (method: string): never => {
  throw new ApiError(
    'NOT_IMPLEMENTED',
    `realApi.${method}() is not implemented yet — see BACKEND.md.`,
  );
};

export const realApi: ShuttleCoachApi = {
  getProPlayers(): Promise<ProPlayer[]> {
    return notImplemented('getProPlayers');
  },
  getUserProfile(): Promise<UserProfile | null> {
    return notImplemented('getUserProfile');
  },
  updateUserProfile(_patch: ProfileInput): Promise<UserProfile> {
    return notImplemented('updateUserProfile');
  },
  signOut(): Promise<void> {
    return notImplemented('signOut');
  },
  deleteAccount(): Promise<void> {
    return notImplemented('deleteAccount');
  },
  getCreditBalance(): Promise<{ credits: number }> {
    return notImplemented('getCreditBalance');
  },
  getTransactions(): Promise<Transaction[]> {
    return notImplemented('getTransactions');
  },
  getCreditPackages(): Promise<CreditPackage[]> {
    return notImplemented('getCreditPackages');
  },
  purchaseCredits(_packageId: string): Promise<PurchaseResult> {
    return notImplemented('purchaseCredits');
  },
  refundCredits(_jobId: string, _reason: string): Promise<RefundResult> {
    return notImplemented('refundCredits');
  },
  submitAnalysis(_input: AnalysisRequest): Promise<{ jobId: string }> {
    return notImplemented('submitAnalysis');
  },
  getAnalysisStatus(_jobId: string): Promise<AnalysisStatusResult> {
    return notImplemented('getAnalysisStatus');
  },
  getAnalysisResult(_jobId: string): Promise<Analysis> {
    return notImplemented('getAnalysisResult');
  },
  listAnalyses(): Promise<Analysis[]> {
    return notImplemented('listAnalyses');
  },
  getAnalysis(_id: string): Promise<Analysis> {
    return notImplemented('getAnalysis');
  },
  deleteAnalysis(_id: string): Promise<void> {
    return notImplemented('deleteAnalysis');
  },
  getDrill(_drillId: string): Promise<Drill> {
    return notImplemented('getDrill');
  },
};

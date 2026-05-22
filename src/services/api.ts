/**
 * ShuttleCoachApi — the single typed contract for every backend interaction.
 *
 * The UI must only ever talk to the backend through this interface (never
 * `fetch` directly). The MVP wires up a mock implementation; a backend
 * developer drops in the real CV/AI pipeline by implementing the same
 * interface. The full request/response/error spec lives in BACKEND.md.
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

/** Result of a successful credit purchase. */
export interface PurchaseResult {
  balance: number;
  transaction: Transaction;
}

/** Result of a credit refund (SPEC §6.3). */
export interface RefundResult {
  balance: number;
  transaction: Transaction;
}

/**
 * Fields required to create a profile on first onboarding, or to patch an
 * existing one. On first call the mock also grants the 100-credit gift.
 */
export type ProfileInput = Partial<UserProfile>;

export interface ShuttleCoachApi {
  /* --- Pro players ------------------------------------------------------- */

  /** All Pro Players with their reference-clip coverage (SPEC §7). */
  getProPlayers(): Promise<ProPlayer[]>;

  /* --- User profile ------------------------------------------------------ */

  /** Current profile, or `null` if the user has not onboarded yet. */
  getUserProfile(): Promise<UserProfile | null>;

  /**
   * Create (first call) or patch the user profile. Creating a profile also
   * gifts 100 free Credits and records a transaction (SPEC §1.5).
   */
  updateUserProfile(patch: ProfileInput): Promise<UserProfile>;

  /** Sign out — ends the session (the real backend invalidates the token). */
  signOut(): Promise<void>;

  /**
   * Permanently delete the account and all its data (SPEC S14). The real
   * backend must erase the user server-side, not just clear the session.
   */
  deleteAccount(): Promise<void>;

  /* --- Credits & store --------------------------------------------------- */

  /** Current credit balance. */
  getCreditBalance(): Promise<{ credits: number }>;

  /** Full transaction ledger, newest first. */
  getTransactions(): Promise<Transaction[]>;

  /** Available credit packages (SPEC §1.5). */
  getCreditPackages(): Promise<CreditPackage[]>;

  /** Purchase a package; credits are added and a transaction recorded. */
  purchaseCredits(packageId: string): Promise<PurchaseResult>;

  /**
   * Refund the 100-credit cost of a failed/cancelled analysis job
   * (SPEC §6.3 — every post-deduction error must auto-refund).
   */
  refundCredits(jobId: string, reason: string): Promise<RefundResult>;

  /* --- Analysis lifecycle ------------------------------------------------ */

  /**
   * Submit a trimmed clip for analysis. Deducts the 100-credit cost and
   * returns a `jobId` to poll. Throws `ApiError('INSUFFICIENT_CREDITS')` if
   * the balance is too low.
   */
  submitAnalysis(input: AnalysisRequest): Promise<{ jobId: string }>;

  /** Poll a job's status, progress (0–1) and ETA (SPEC §6 polling model). */
  getAnalysisStatus(jobId: string): Promise<AnalysisStatusResult>;

  /** Fetch the finished result for a `done` job; also saves it to history. */
  getAnalysisResult(jobId: string): Promise<Analysis>;

  /** All saved analyses, newest first. */
  listAnalyses(): Promise<Analysis[]>;

  /** A single saved analysis by id. */
  getAnalysis(id: string): Promise<Analysis>;

  /** Permanently delete a saved analysis. */
  deleteAnalysis(id: string): Promise<void>;

  /* --- Drills ------------------------------------------------------------ */

  /** Drill detail for an S10 "How To Fix" sheet. */
  getDrill(drillId: string): Promise<Drill>;
}

/** Stable error codes thrown by the service layer. See BACKEND.md. */
export type ApiErrorCode =
  | 'INSUFFICIENT_CREDITS'
  | 'NOT_FOUND'
  | 'JOB_NOT_DONE'
  | 'NETWORK_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'UNKNOWN';

/** Typed error surfaced by every API method. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
    this.code = code;
  }
}

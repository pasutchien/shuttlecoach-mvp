/**
 * Shared domain types for Shuttle Coach.
 *
 * These shapes are the contract between the UI, the service layer (`src/services`)
 * and the future real backend. Both the mock and the real API implementations
 * reference these — see BACKEND.md.
 */

/* ----------------------------------------------------------------------------
 * Enumerations
 * ------------------------------------------------------------------------- */

/** The five badminton strokes the AI can analyse (SPEC §5/S5). */
export type StrokeType = 'Smash' | 'Drop_Shot' | 'Clear' | 'Drive' | 'Net_Kill';

export const STROKE_TYPES: StrokeType[] = [
  'Smash',
  'Drop_Shot',
  'Clear',
  'Drive',
  'Net_Kill',
];

export type PlayStyle = 'Singles' | 'Doubles' | 'Both';

/** Five-stop experience scale (SPEC S2 step 4). */
export type ExperienceLevel =
  | 'Beginner'
  | 'Lower_Intermediate'
  | 'Intermediate'
  | 'Upper_Intermediate'
  | 'Advanced';

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Beginner',
  'Lower_Intermediate',
  'Intermediate',
  'Upper_Intermediate',
  'Advanced',
];

/** Primary-goal chips (SPEC S2 step 4). */
export type Goal =
  | 'Improve_Smash'
  | 'Develop_Drop_Shot'
  | 'Improve_Footwork'
  | 'Consistency'
  | 'All_Round';

export const GOALS: Goal[] = [
  'Improve_Smash',
  'Develop_Drop_Shot',
  'Improve_Footwork',
  'Consistency',
  'All_Round',
];

/** Mistake severity, ordered Critical → Major → Minor (SPEC §8.3). */
export type Severity = 'Critical' | 'Major' | 'Minor';

/** The seven stroke-analysis checkpoints (SPEC §8.1). */
export type CheckpointKey =
  | 'grip'
  | 'stance'
  | 'backswing'
  | 'elbow'
  | 'contact'
  | 'weight'
  | 'follow_through';

export const CHECKPOINT_KEYS: CheckpointKey[] = [
  'grip',
  'stance',
  'backswing',
  'elbow',
  'contact',
  'weight',
  'follow_through',
];

/* ----------------------------------------------------------------------------
 * Pro players
 * ------------------------------------------------------------------------- */

export interface ProPlayer {
  id: string;
  name: string;
  heightCm: number;
  nationality: string;
  playStyle: PlayStyle;
  /** Strokes this player has reference footage for. */
  availableStrokes: StrokeType[];
  /** Reference clip identifiers keyed by stroke. */
  referenceClips: Partial<Record<StrokeType, string[]>>;
  /** Inclusive [min, max] height band this player is a good comparison for. */
  matchingHeightRangeCm: [number, number];
  /** Relative quality of reference footage (0–100), used as the global fallback. */
  rating: number;
}

/* ----------------------------------------------------------------------------
 * User profile
 * ------------------------------------------------------------------------- */

export interface NotificationSettings {
  analysisComplete: boolean;
  weeklySummary: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  displayName: string;
  heightCm: number;
  weightKg?: number;
  favoriteProId?: string;
  playStyle: PlayStyle;
  experienceLevel: ExperienceLevel;
  goals: Goal[];
  notifications: NotificationSettings;
  /** True once the first analysis celebration has been shown (SPEC §6.5). */
  hasCompletedFirstAnalysis: boolean;
}

/* ----------------------------------------------------------------------------
 * Credits & store
 * ------------------------------------------------------------------------- */

export interface CreditPackage {
  id: string;
  credits: number;
  priceThb: number;
  /** Percentage saved vs. the base rate, if any. */
  savingsPct?: number;
  mostPopular?: boolean;
  bestForKey: string;
}

export type TransactionType = 'purchase' | 'analysis' | 'refund';

export interface Transaction {
  id: string;
  /** ISO-8601 timestamp. */
  date: string;
  type: TransactionType;
  /** Signed credit delta: positive for purchases/refunds, negative for analyses. */
  credits: number;
  /** Human label, e.g. "Practice Pack" or "Smash Analysis". */
  label: string;
  balanceAfter: number;
}

/* ----------------------------------------------------------------------------
 * Drills
 * ------------------------------------------------------------------------- */

export interface Drill {
  id: string;
  name: string;
  steps: string[];
  coachTip: string;
  /** Title of the (v2) demonstration video — placeholder only in MVP. */
  relatedVideoTitle: string;
}

/* ----------------------------------------------------------------------------
 * Analysis
 * ------------------------------------------------------------------------- */

export interface CheckpointScore {
  key: CheckpointKey;
  /** 0–100 sub-score. */
  score: number;
}

export interface MistakeCard {
  id: string;
  /** Plain-language title, max ~6 words (SPEC §8.3). */
  title: string;
  /** 1–2 sentence description: the mistake plus its performance impact. */
  description: string;
  severity: Severity;
  /** Timestamp (seconds) of the worst frame — drives the video jump. */
  timestampSec: number;
  /** Drill referenced by the "How to Fix" sheet (S10). */
  drillId: string;
}

export interface Analysis {
  id: string;
  jobId: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
  strokeType: StrokeType;
  /** Weighted overall score, 0–100 (SPEC §8.2). */
  overallScore: number;
  checkpoints: CheckpointScore[];
  proPlayerId: string;
  /** Source clip for the left (user) panel on S9. */
  userVideoUrl: string;
  /** Matched pro reference clip for the right panel on S9. */
  proVideoUrl: string;
  /** Up to 5 cards, pre-sorted Critical → Major → Minor. */
  mistakes: MistakeCard[];
  /** Trimmed clip duration in seconds. */
  durationSec: number;
}

/* ----------------------------------------------------------------------------
 * Analysis request / job lifecycle
 * ------------------------------------------------------------------------- */

/** Normalised point in [0,1] relative to the calibration frame. */
export interface Point {
  x: number;
  y: number;
}

/** The four court corners from S6 calibration. */
export interface CourtCorners {
  tl: Point;
  tr: Point;
  bl: Point;
  br: Point;
}

export interface AnalysisRequest {
  /** Reference to the trimmed clip (URI on native, bundled asset on web). */
  clipRef: string;
  trimStartSec: number;
  trimEndSec: number;
  strokeType: StrokeType;
  courtCorners: CourtCorners;
  /** Profile fields the CV pipeline needs (SPEC §6). */
  userProfileSnapshot: {
    heightCm: number;
    favoriteProId?: string;
  };
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export type AnalysisErrorCode =
  | 'VIDEO_TOO_DARK'
  | 'PLAYER_NOT_DETECTED'
  | 'VIDEO_TOO_BLURRY'
  | 'PROCESSING_TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface AnalysisError {
  code: AnalysisErrorCode;
  /** i18n key for the user-facing message. */
  messageKey: string;
  /** Whether credits should be auto-refunded for this failure (SPEC §6.3). */
  refundable: boolean;
}

export interface AnalysisStatusResult {
  status: JobStatus;
  /** 0–1 completion fraction. */
  progress: number;
  /** Estimated seconds remaining. */
  etaSeconds: number;
  error?: AnalysisError;
}

/* ----------------------------------------------------------------------------
 * Coaching tips
 * ------------------------------------------------------------------------- */

export interface CoachingTip {
  id: string;
  /** Short i18n key resolved by the UI. */
  textKey: string;
}

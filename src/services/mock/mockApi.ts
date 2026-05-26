/**
 * Mock implementation of `ShuttleCoachApi`.
 *
 * Backs the entire app with no network: realistic in-memory fixtures, artificial
 * latency, and a simulated 30–90s analysis job (SPEC §9.1). The job can be
 * forced to fail via `EXPO_PUBLIC_FORCE_ANALYSIS_ERROR` to demo §6.3 / §10.3.
 */
import type {
  Analysis,
  AnalysisError,
  AnalysisErrorCode,
  AnalysisRequest,
  AnalysisStatusResult,
  CreditPackage,
  Drill,
  ProPlayer,
  StrokeType,
  Transaction,
  UserProfile,
} from '@/src/types';
import { ApiError, type ProfileInput, type ShuttleCoachApi } from '../api';
import {
  ANALYSIS_COST,
  CREDIT_PACKAGES,
  ONBOARDING_GIFT,
  getPackage,
} from '@/src/constants/packages';
import { DRILLS } from '@/src/constants/drills';
import { PRO_PLAYERS, matchProPlayer } from '@/src/constants/proPlayers';
import { buildAnalysis } from './generate';
import { getDb, loadDb, persist, resetDb } from './db';

/* --- timing knobs --------------------------------------------------------- */

/** Simulated AI processing duration (SPEC §9.1: 30–90s). Env-tunable for demos. */
const JOB_SECONDS = Number(process.env.EXPO_PUBLIC_MOCK_JOB_SECONDS ?? 30);

/** Optional forced failure for demoing the error-recovery flow (SPEC §10.3). */
const FORCED_ERROR = process.env.EXPO_PUBLIC_FORCE_ANALYSIS_ERROR as
  | AnalysisErrorCode
  | undefined;

/** Artificial network latency. */
const delay = (ms = 320) => new Promise<void>((r) => setTimeout(r, ms));

const STROKE_LABEL: Record<StrokeType, string> = {
  Smash: 'Smash',
  Drop_Shot: 'Drop Shot',
  Clear: 'Clear',
  Drive: 'Drive',
  Net_Kill: 'Net Kill',
};

/* --- in-memory job registry ---------------------------------------------- */

interface Job {
  jobId: string;
  request: AnalysisRequest;
  startedAt: number;
  durationMs: number;
  /** Cached result once built, so polling/result calls are idempotent. */
  result?: Analysis;
}

const jobs = new Map<string, Job>();

let idCounter = 0;
const nextId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

function errorFor(code: AnalysisErrorCode): AnalysisError {
  return {
    code,
    messageKey: `error.${code}`,
    // Every post-deduction failure is refundable (SPEC §6.3).
    refundable: true,
  };
}

/* --- the mock API --------------------------------------------------------- */

export const mockApi: ShuttleCoachApi = {
  async login(): Promise<{ userId: string }> {
    await delay(200);
    return { userId: 'mock-user' };
  },

  async getProPlayers(): Promise<ProPlayer[]> {
    await delay(260);
    return PRO_PLAYERS;
  },

  async getUserProfile(): Promise<UserProfile | null> {
    await loadDb();
    await delay(180);
    return getDb().profile;
  },

  async updateUserProfile(patch: ProfileInput): Promise<UserProfile> {
    await loadDb();
    await delay(280);
    const db = getDb();

    if (!db.profile) {
      // First onboarding — create the profile and grant the welcome gift.
      const profile: UserProfile = {
        id: 'user-1',
        fullName: patch.fullName ?? '',
        displayName: patch.displayName?.trim() || patch.fullName || 'Player',
        heightCm: patch.heightCm ?? 170,
        weightKg: patch.weightKg,
        favoriteProId: patch.favoriteProId,
        playStyle: patch.playStyle ?? 'Both',
        experienceLevel: patch.experienceLevel ?? 'Intermediate',
        goals: patch.goals ?? [],
        notifications: patch.notifications ?? {
          analysisComplete: true,
          weeklySummary: true,
        },
        hasCompletedFirstAnalysis: false,
      };
      db.profile = profile;
      db.credits += ONBOARDING_GIFT;
      db.transactions.unshift({
        id: nextId('tx'),
        date: new Date().toISOString(),
        type: 'purchase',
        credits: ONBOARDING_GIFT,
        label: 'Welcome Gift',
        balanceAfter: db.credits,
      });
      await persist();
      return profile;
    }

    db.profile = { ...db.profile, ...patch };
    await persist();
    return db.profile;
  },

  async signOut(): Promise<void> {
    await delay(280);
    // The mock has no auth — clearing the DB returns to a brand-new user.
    await resetDb('empty');
  },

  async deleteAccount(): Promise<void> {
    await delay(360);
    await resetDb('empty');
  },

  async getCreditBalance(): Promise<{ credits: number }> {
    await loadDb();
    await delay(160);
    return { credits: getDb().credits };
  },

  async getTransactions(): Promise<Transaction[]> {
    await loadDb();
    await delay(220);
    return [...getDb().transactions];
  },

  async getCreditPackages(): Promise<CreditPackage[]> {
    await delay(140);
    return CREDIT_PACKAGES;
  },

  async purchaseCredits(packageId: string) {
    await loadDb();
    await delay(700); // simulate a payment gateway round-trip
    const pkg = getPackage(packageId);
    if (!pkg) throw new ApiError('NOT_FOUND', `Unknown package ${packageId}`);

    const db = getDb();
    db.credits += pkg.credits;
    const transaction: Transaction = {
      id: nextId('tx'),
      date: new Date().toISOString(),
      type: 'purchase',
      credits: pkg.credits,
      label: packageLabel(pkg),
      balanceAfter: db.credits,
    };
    db.transactions.unshift(transaction);
    await persist();
    return { balance: db.credits, transaction };
  },

  async refundCredits(jobId: string, reason: string) {
    await loadDb();
    await delay(240);
    const db = getDb();
    db.credits += ANALYSIS_COST;
    const transaction: Transaction = {
      id: nextId('tx'),
      date: new Date().toISOString(),
      type: 'refund',
      credits: ANALYSIS_COST,
      label: `Refund — ${reason}`,
      balanceAfter: db.credits,
    };
    db.transactions.unshift(transaction);
    await persist();
    return { balance: db.credits, transaction };
  },

  async submitAnalysis(input: AnalysisRequest): Promise<{ jobId: string }> {
    await loadDb();
    await delay(520);
    const db = getDb();

    if (db.credits < ANALYSIS_COST) {
      throw new ApiError('INSUFFICIENT_CREDITS');
    }

    // Charge the analysis up-front; failures are refunded later (SPEC §6.3).
    db.credits -= ANALYSIS_COST;
    db.transactions.unshift({
      id: nextId('tx'),
      date: new Date().toISOString(),
      type: 'analysis',
      credits: -ANALYSIS_COST,
      label: `${STROKE_LABEL[input.strokeType]} Analysis`,
      balanceAfter: db.credits,
    });
    await persist();

    const jobId = nextId('job');
    jobs.set(jobId, {
      jobId,
      request: input,
      startedAt: Date.now(),
      durationMs: JOB_SECONDS * 1000,
    });
    return { jobId };
  },

  async getAnalysisStatus(jobId: string): Promise<AnalysisStatusResult> {
    await delay(120);
    const job = jobs.get(jobId);
    if (!job) throw new ApiError('NOT_FOUND', `Unknown job ${jobId}`);

    const elapsed = Date.now() - job.startedAt;
    const progress = Math.min(1, elapsed / job.durationMs);
    const etaSeconds = Math.max(
      0,
      Math.ceil((job.durationMs - elapsed) / 1000),
    );

    // Forced failure surfaces ~65% of the way through (SPEC §10.3 demo).
    if (FORCED_ERROR && progress >= 0.65) {
      return {
        status: 'failed',
        progress,
        etaSeconds: 0,
        error: errorFor(FORCED_ERROR),
      };
    }

    if (progress >= 1) return { status: 'done', progress: 1, etaSeconds: 0 };
    if (progress < 0.05) return { status: 'queued', progress, etaSeconds };
    return { status: 'processing', progress, etaSeconds };
  },

  async getAnalysisResult(jobId: string): Promise<Analysis> {
    await loadDb();
    await delay(300);
    const job = jobs.get(jobId);
    if (!job) throw new ApiError('NOT_FOUND', `Unknown job ${jobId}`);
    if (job.result) return job.result;

    const elapsed = Date.now() - job.startedAt;
    if (elapsed < job.durationMs) throw new ApiError('JOB_NOT_DONE');

    const db = getDb();
    const { strokeType, trimStartSec, trimEndSec, userProfileSnapshot } =
      job.request;
    const durationSec = Number((trimEndSec - trimStartSec).toFixed(1));
    const pro = matchProPlayer(
      strokeType,
      userProfileSnapshot.heightCm,
      userProfileSnapshot.favoriteProId,
    );

    // Vary the result band by job so successive analyses differ.
    const seed = Math.abs(hashString(jobId));
    const targetBand = 56 + (seed % 28); // 56–83

    const analysis = buildAnalysis({
      id: nextId('analysis'),
      jobId,
      createdAt: new Date().toISOString(),
      strokeType,
      proPlayerId: pro.id,
      durationSec,
      targetBand,
      seed,
    });

    job.result = analysis;
    db.analyses.unshift(analysis);
    if (db.profile) db.profile.hasCompletedFirstAnalysis = true;
    await persist();
    return analysis;
  },

  async listAnalyses(): Promise<Analysis[]> {
    await loadDb();
    await delay(260);
    return [...getDb().analyses];
  },

  async getAnalysis(id: string): Promise<Analysis> {
    await loadDb();
    await delay(200);
    const found = getDb().analyses.find((a) => a.id === id);
    if (!found) throw new ApiError('NOT_FOUND', `Unknown analysis ${id}`);
    return found;
  },

  async deleteAnalysis(id: string): Promise<void> {
    await loadDb();
    await delay(220);
    const db = getDb();
    db.analyses = db.analyses.filter((a) => a.id !== id);
    await persist();
  },

  async getDrill(drillId: string): Promise<Drill> {
    await delay(200);
    const drill = DRILLS.find((d) => d.id === drillId);
    if (!drill) throw new ApiError('NOT_FOUND', `Unknown drill ${drillId}`);
    return drill;
  },
};

/* --- helpers -------------------------------------------------------------- */

function packageLabel(pkg: CreditPackage): string {
  if (pkg.id === 'single-match') return 'Single Match';
  if (pkg.id === 'practice-pack') return 'Practice Pack';
  if (pkg.id === 'pro-pack') return 'Pro Pack';
  return 'Credit Package';
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

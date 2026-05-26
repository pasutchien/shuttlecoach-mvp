/**
 * Real backend implementation for ShuttleCoach.
 *
 * Drop this file into the frontend repo at:
 *   src/services/real/realApi.ts
 *
 * Then set in your .env:
 *   EXPO_PUBLIC_USE_MOCK_API=false
 *   EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:8000
 */
import { Platform } from "react-native";
import type {
  Analysis,
  AnalysisRequest,
  AnalysisStatusResult,
  CreditPackage,
  Drill,
  ProPlayer,
  Transaction,
  UserProfile,
} from "@/src/types";
import {
  ApiError,
  type ProfileInput,
  type PurchaseResult,
  type RefundResult,
  type ShuttleCoachApi,
} from "../api";

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ?? ""
).replace(/\/$/, "");

let _activeUserId: string | null = null;

/** Call this after login (and on app startup when restoring from storage). */
export function setActiveUserId(id: string) {
  _activeUserId = id;
}

// ── Transport helper ──────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    const headers: Record<string, string> = {};
    if (body) headers["Content-Type"] = "application/json";
    if (_activeUserId) headers["X-User-Id"] = _activeUserId;
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError("NETWORK_ERROR", String(e));
  }

  if (res.status === 404) throw new ApiError("NOT_FOUND");
  if (res.status === 402) throw new ApiError("INSUFFICIENT_CREDITS");
  if (res.status === 409) throw new ApiError("JOB_NOT_DONE");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError("UNKNOWN", `HTTP ${res.status}: ${text}`);
  }

  const text = await res.text();
  if (!text || text === "null") return null as T;
  return JSON.parse(text) as T;
}

// ── Shape converters (snake_case backend → camelCase frontend) ────────────────

function toUserProfile(
  raw: Record<string, unknown> | null,
): UserProfile | null {
  if (!raw) return null;
  const name = (raw.name as string | undefined) ?? '';
  return {
    id: raw.id as string,
    fullName: name,
    displayName: name,
    heightCm: (raw.heightCm as number | undefined) ?? 170,
    favoriteProId: raw.favoriteProId as string | undefined,
    playStyle: 'Singles',
    experienceLevel: 'Intermediate',
    goals: [],
    notifications: {
      analysisComplete: true,
      weeklySummary: false,
    },
    hasCompletedFirstAnalysis: false,
  };
}

function toTransaction(raw: Record<string, unknown>): Transaction {
  return {
    id: raw.id as string,
    type: raw.type as Transaction["type"],
    credits: raw.credits as number,
    balanceAfter: raw.balanceAfter as number,
    label: raw.label as string,
    createdAt: raw.createdAt as string,
  };
}

function toAnalysis(raw: Record<string, unknown>): Analysis {
  return {
    id: raw.id as string,
    jobId: raw.jobId as string,
    createdAt: raw.createdAt as string,
    strokeType: raw.strokeType as Analysis["strokeType"],
    overallScore: raw.overallScore as number,
    checkpoints: (raw.checkpoints as Analysis["checkpoints"]) ?? [],
    proPlayerId: raw.proPlayerId as string,
    userVideoUrl: raw.userVideoUrl as string,
    proVideoUrl: raw.proVideoUrl as string,
    mistakes: (raw.mistakes as Analysis["mistakes"]) ?? [],
    phases: raw.phases as Analysis["phases"],
    durationSec: raw.durationSec as number,
  };
}

// ── Upload helper (multipart) ─────────────────────────────────────────────────

async function uploadClip(uri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === "web") {
    // On web, {uri, name, type} isn't recognised — fetch the URI as a real Blob.
    const fetched = await fetch(uri);
    const blob = await fetched.blob();
    form.append("file", blob, "clip.mp4");
  } else {
    form.append("file", {
      uri,
      name: "clip.mp4",
      type: "video/mp4",
    } as unknown as Blob);
  }

  const headers: Record<string, string> = {};
  if (_activeUserId) headers["X-User-Id"] = _activeUserId;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/upload`, { method: "POST", body: form, headers });
  } catch (e) {
    throw new ApiError("NETWORK_ERROR", String(e));
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError("NETWORK_ERROR", `Upload failed: HTTP ${res.status}: ${detail}`);
  }
  const json = (await res.json()) as { clipRef: string };
  return json.clipRef;
}

// ── API implementation ────────────────────────────────────────────────────────

export const realApi: ShuttleCoachApi = {
  // --- Auth ------------------------------------------------------------------

  async login(): Promise<{ userId: string }> {
    const data = await request<{ userId: string }>("POST", "/demo-login");
    setActiveUserId(data.userId);
    return data;
  },

  // --- Pro players -----------------------------------------------------------

  getProPlayers(): Promise<ProPlayer[]> {
    return request<ProPlayer[]>("GET", "/pro-players");
  },

  // --- User profile ----------------------------------------------------------

  async getUserProfile(): Promise<UserProfile | null> {
    const raw = await request<Record<string, unknown> | null>("GET", "/me");
    return toUserProfile(raw);
  },

  async updateUserProfile(patch: ProfileInput): Promise<UserProfile> {
    // Map frontend field names to what the backend expects.
    const backendPatch: Record<string, unknown> = {};
    if (patch.fullName     !== undefined) backendPatch.name           = patch.fullName;
    if (patch.heightCm     !== undefined) backendPatch.heightCm       = patch.heightCm;
    if (patch.favoriteProId !== undefined) backendPatch.favoriteProId = patch.favoriteProId;
    const raw = await request<Record<string, unknown>>("PUT", "/me", backendPatch);
    return { ...toUserProfile(raw)!, ...patch };
  },

  async signOut(): Promise<void> {
    await request("POST", "/sign-out");
  },

  async deleteAccount(): Promise<void> {
    await request("DELETE", "/me");
  },

  // --- Credits & store -------------------------------------------------------

  getCreditBalance(): Promise<{ credits: number }> {
    return request("GET", "/credits");
  },

  async getTransactions(): Promise<Transaction[]> {
    const raw = await request<Record<string, unknown>[]>(
      "GET",
      "/credits/transactions",
    );
    return raw.map(toTransaction);
  },

  getCreditPackages(): Promise<CreditPackage[]> {
    return request("GET", "/credits/packages");
  },

  async purchaseCredits(packageId: string): Promise<PurchaseResult> {
    const raw = await request<{
      balance: number;
      transaction: Record<string, unknown>;
    }>("POST", "/credits/purchase", { packageId });
    return {
      balance: raw.balance,
      transaction: toTransaction(raw.transaction),
    };
  },

  async refundCredits(jobId: string, reason: string): Promise<RefundResult> {
    const raw = await request<{
      balance: number;
      transaction: Record<string, unknown>;
    }>("POST", "/credits/refund", { jobId, reason });
    return {
      balance: raw.balance,
      transaction: toTransaction(raw.transaction),
    };
  },

  // --- Analysis lifecycle ----------------------------------------------------

  async submitAnalysis(input: AnalysisRequest): Promise<{ jobId: string }> {
    // 1. Upload the clip to the backend storage
    const clipRef = await uploadClip(input.clipRef);

    // 2. Submit the analysis job
    return request("POST", "/analyses", {
      clipRef,
      trimStartSec: input.trimStartSec,
      trimEndSec: input.trimEndSec,
      strokeType: input.strokeType,
      courtCorners: input.courtCorners,
      userProfileSnapshot: input.userProfileSnapshot,
    });
  },

  async getAnalysisStatus(jobId: string): Promise<AnalysisStatusResult> {
    return request("GET", `/analyses/jobs/${jobId}/status`);
  },

  async getAnalysisResult(jobId: string): Promise<Analysis> {
    const raw = await request<Record<string, unknown>>(
      "GET",
      `/analyses/jobs/${jobId}/result`,
    );
    return toAnalysis(raw);
  },

  async listAnalyses(): Promise<Analysis[]> {
    const raw = await request<Record<string, unknown>[]>("GET", "/analyses");
    return raw.map(toAnalysis);
  },

  async getAnalysis(id: string): Promise<Analysis> {
    const raw = await request<Record<string, unknown>>(
      "GET",
      `/analyses/${id}`,
    );
    return toAnalysis(raw);
  },

  async deleteAnalysis(id: string): Promise<void> {
    await request("DELETE", `/analyses/${id}`);
  },

  // --- Drills ----------------------------------------------------------------

  getDrill(drillId: string): Promise<Drill> {
    return request("GET", `/drills/${drillId}`);
  },
};

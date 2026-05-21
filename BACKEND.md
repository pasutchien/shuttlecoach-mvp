# Shuttle Coach — Backend Contract

This document is the spec for the backend developer. The front-end MVP is
complete and talks to the backend exclusively through one TypeScript interface,
**`ShuttleCoachApi`** (`src/services/api.ts`). The UI never calls `fetch`
directly.

To go live:

1. Implement every method in `src/services/real/realApi.ts` against this
   contract.
2. Map transport/HTTP failures onto `ApiError` with the codes below.
3. Set `EXPO_PUBLIC_USE_MOCK_API=false` (and `EXPO_PUBLIC_API_BASE_URL`).

No UI or store code changes are required to switch over.

All shared shapes are defined in `src/types/index.ts` — implement against those
types verbatim. This contract maps onto the existing **ShuttleIQ CV pipeline**:
`video + stroke + 4 court corners → pose analysis → pro match → scored result
with phase-by-phase feedback`.

---

## Conventions

- Every method is `async` and returns a `Promise`.
- Errors are thrown as `ApiError` (`src/services/api.ts`) with a stable
  `code`. The UI branches on `code`, never on `message`.
- Timestamps are ISO-8601 strings. Durations are seconds. Money is THB integers.
- "Credits" are integers; one analysis costs **100** (`ANALYSIS_COST`).

### Error codes (`ApiErrorCode`)

| Code | When | UI behaviour |
|---|---|---|
| `INSUFFICIENT_CREDITS` | `submitAnalysis` with balance < 100 | S7 shows the top-up variant |
| `NOT_FOUND` | Unknown id (job / analysis / drill / package) | Inline error / error modal |
| `JOB_NOT_DONE` | `getAnalysisResult` before the job finished | Caller keeps polling |
| `NETWORK_ERROR` | Transport failure | Retry modal (SPEC §6.3) |
| `NOT_IMPLEMENTED` | Real method not yet wired | Dev-only |
| `UNKNOWN` | Anything else | Generic error modal |

### Analysis-job error codes (`AnalysisErrorCode`)

Returned **inside a job status** (not thrown) when a job fails — see the
polling model. Each carries a `messageKey` (i18n key) and `refundable: boolean`.

`VIDEO_TOO_DARK` · `PLAYER_NOT_DETECTED` · `VIDEO_TOO_BLURRY` ·
`PROCESSING_TIMEOUT` · `NETWORK_ERROR` · `UNKNOWN`

**Rule (SPEC §6.3):** every job failure *after* the credit deduction must be
refundable. The client calls `refundCredits` and shows a refund toast.

---

## Methods

### Pro players

#### `getProPlayers(): Promise<ProPlayer[]>`
All pro players and their reference-clip coverage. Static reference data
(SPEC §7); may be cached. `ProPlayer` shape — see `src/types`.

> Roster note: SPEC §7.2 lists no Net Kill coverage. The mock fixture grants a
> few players Net Kill clips so the matcher always resolves. The real backend
> should ensure ≥1 player covers every selectable stroke, or `submitAnalysis`
> should reject unsupported strokes.

### User profile

#### `getUserProfile(): Promise<UserProfile | null>`
Returns the current user's profile, or `null` if they have not onboarded.

#### `updateUserProfile(patch: ProfileInput): Promise<UserProfile>`
Create-or-update. On the **first** call (no profile yet) the backend must:
- create the profile, **and**
- grant the **100-credit welcome gift** (SPEC §1.5) — add 100 credits and
  record a `purchase` transaction labelled "Welcome Gift".

Subsequent calls patch the existing profile. Returns the full updated profile.

### Credits & store

#### `getCreditBalance(): Promise<{ credits: number }>`
Current balance.

#### `getTransactions(): Promise<Transaction[]>`
Full ledger, **newest first**. `Transaction.credits` is signed
(`+` purchase/refund, `−` analysis). `balanceAfter` is the running balance.

#### `getCreditPackages(): Promise<CreditPackage[]>`
The three purchasable packages (SPEC §1.5). Static; may be cached.

#### `purchaseCredits(packageId: string): Promise<PurchaseResult>`
Process payment for a package, add its credits, record a `purchase`
transaction. Returns `{ balance, transaction }`.
Throws `NOT_FOUND` for an unknown package. Payment-gateway failures →
`ApiError('NETWORK_ERROR')` (SPEC §6.3 — no charge made).

#### `refundCredits(jobId: string, reason: string): Promise<RefundResult>`
Refund the 100-credit cost of a failed/cancelled analysis. Add 100 credits,
record a `refund` transaction labelled with `reason`. Returns
`{ balance, transaction }`. Idempotent per `jobId` is recommended.

### Analysis lifecycle

This is the core CV pipeline. It is **asynchronous**: submit → poll → fetch.

#### `submitAnalysis(input: AnalysisRequest): Promise<{ jobId: string }>`

`AnalysisRequest`:
```ts
{
  clipRef: string;            // upload reference / URI of the trimmed clip
  trimStartSec: number;
  trimEndSec: number;         // trimEnd - trimStart ∈ [1, 15]
  strokeType: StrokeType;     // 'Smash' | 'Drop_Shot' | 'Clear' | 'Drive' | 'Net_Kill'
  courtCorners: CourtCorners; // { tl, tr, bl, br }, each { x, y } normalised 0–1
  userProfileSnapshot: { heightCm: number; favoriteProId?: string };
}
```

Behaviour:
- If balance < 100 → throw `ApiError('INSUFFICIENT_CREDITS')` (no job created).
- Otherwise **deduct 100 credits immediately**, record an `analysis`
  transaction, enqueue the CV job, return its `jobId`.
- Failures *after* this deduction are surfaced via job status + refunded by the
  client (see the rule above). A pre-receipt upload failure should throw
  `NETWORK_ERROR` and **not** charge (SPEC §6.3).

The pipeline should: trim → run pose estimation → use `courtCorners` for
depth/distance calibration → score the 7 checkpoints (§8.1) → compute the
weighted overall (§8.2) → match a pro (§7.3, can reuse `matchProPlayer`) →
generate ≤5 mistake cards (§8.3).

#### `getAnalysisStatus(jobId: string): Promise<AnalysisStatusResult>`

Polling model — the client polls **every ~1s** (S8):
```ts
{
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;     // 0–1
  etaSeconds: number;   // estimated seconds remaining
  error?: AnalysisError; // present iff status === 'failed'
}
```
- `queued` → `processing` → `done` on success.
- `failed` carries `error` (`{ code, messageKey, refundable }`).
- Typical job duration 30–90s (SPEC §9.1). The S8 screen also enforces a
  client-side timeout that maps to `PROCESSING_TIMEOUT`.
- Throw `NOT_FOUND` for an unknown `jobId`.

#### `getAnalysisResult(jobId: string): Promise<Analysis>`
Call once `status === 'done'`. Returns the full `Analysis` and **persists it to
history**. Throw `ApiError('JOB_NOT_DONE')` if called early, `NOT_FOUND` for an
unknown job.

`Analysis` (see `src/types`):
```ts
{
  id, jobId, createdAt,
  strokeType,
  overallScore: number,                 // 0–100, weighted (§8.2)
  checkpoints: { key, score }[],         // 7 sub-scores (§8.1)
  proPlayerId: string,                   // matched pro
  userVideoUrl: string,                  // left panel (S9)
  proVideoUrl: string,                   // right panel (S9)
  mistakes: MistakeCard[],               // ≤5, sorted Critical→Major→Minor (§8.3)
  durationSec: number,
}
```
`userVideoUrl` / `proVideoUrl` are plain URLs for the real backend. (The mock
uses `sample://` markers resolved by `resolveVideoSource` in
`src/constants/media.ts`.)

Each `MistakeCard` references a `drillId` resolved by `getDrill`.

#### `listAnalyses(): Promise<Analysis[]>`
All saved analyses, **newest first**.

#### `getAnalysis(id: string): Promise<Analysis>`
One analysis by `id`. Throw `NOT_FOUND` if absent.

#### `deleteAnalysis(id: string): Promise<void>`
Permanently delete an analysis (S13 swipe-to-delete).

### Drills

#### `getDrill(drillId: string): Promise<Drill>`
Drill detail for the S10 "How To Fix" sheet — `{ id, name, steps[], coachTip,
relatedVideoTitle }`. Throw `NOT_FOUND` if absent. Drill content may be a static
library or generated alongside the analysis.

---

## Localisation note

`MistakeCard` titles/descriptions and `Drill` text are **analysis content**, not
UI chrome — the app renders them as-is (they are not i18n keys). For a Thai-first
product the backend should return this content in the user's language (the
client can send an `Accept-Language` header or a profile locale field).

---

## Suggested HTTP mapping (non-binding)

| Method | HTTP |
|---|---|
| `getProPlayers` | `GET /pro-players` |
| `getUserProfile` | `GET /me` |
| `updateUserProfile` | `PUT /me` |
| `getCreditBalance` | `GET /credits` |
| `getTransactions` | `GET /credits/transactions` |
| `getCreditPackages` | `GET /credits/packages` |
| `purchaseCredits` | `POST /credits/purchase` `{ packageId }` |
| `refundCredits` | `POST /credits/refund` `{ jobId, reason }` |
| `submitAnalysis` | `POST /analyses` (multipart: clip + JSON) |
| `getAnalysisStatus` | `GET /analyses/jobs/:jobId/status` |
| `getAnalysisResult` | `GET /analyses/jobs/:jobId/result` |
| `listAnalyses` | `GET /analyses` |
| `getAnalysis` | `GET /analyses/:id` |
| `deleteAnalysis` | `DELETE /analyses/:id` |
| `getDrill` | `GET /drills/:drillId` |

Authentication, the upload transport for `clipRef`, and push notifications for
"analysis complete" are out of scope for this contract and left to the backend
team.

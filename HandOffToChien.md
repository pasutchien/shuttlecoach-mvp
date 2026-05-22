# Hand-off to Chien — Backend / AI Integration

Hi Chien 👋 — the **Shuttle Coach** front-end MVP is complete. All 15 screens are
built and fully clickable today on a **mock data layer**. This document is your
orientation guide for plugging in the real CV/AI backend, authentication, and
data.

> **Companion docs:** [`BACKEND.md`](./BACKEND.md) is the formal API contract
> (every method, request/response shape, error codes). [`SPEC.md`](./SPEC.md) is
> the product spec. This file is the friendly overview — start here, then use
> `BACKEND.md` as the reference while you implement.

---

## 1. The one rule

**The whole app talks to the backend through a single TypeScript interface —
`ShuttleCoachApi`.** The UI never calls `fetch` directly. You implement that
interface; nothing in the UI or the stores changes.

```
src/services/
  api.ts            ← THE CONTRACT: the ShuttleCoachApi interface + ApiError
  index.ts          ← picks the mock or the real impl from an env flag
  mock/             ← the working mock implementation (fixtures, job simulation)
  real/realApi.ts   ← STUB — every method throws NOT_IMPLEMENTED. THIS IS YOURS.
```

Switching is one environment variable:

```bash
EXPO_PUBLIC_USE_MOCK_API=false             # use your real implementation
EXPO_PUBLIC_API_BASE_URL=https://api...    # your backend base URL
```

---

## 2. Run it locally (5 minutes)

Prerequisite: **Node.js 20+**.

```bash
npm install
npm run web        # browser demo at http://localhost:8081 (view phone-width)
npm start          # QR code for the Expo Go app on a device
npm run typecheck  # tsc --noEmit (strict)
npm run build:web  # static web export to dist/
```

The seeded build starts as a returning user with history. **Profile → Sign Out**
drops you to a brand-new user — that walks the Splash → Login → Onboarding →
empty-states path.

---

## 3. Your integration checklist

1. Open `src/services/real/realApi.ts`. Every method currently throws
   `ApiError('NOT_IMPLEMENTED')` — replace each body with a real HTTP call.
2. `fetch` is allowed **only** in that file. Keep all transport code there.
3. Match the request/response shapes exactly — they are the TypeScript types in
   `src/types/index.ts`; import them, don't redefine them.
4. Map HTTP/transport failures onto the `ApiError` class with the documented
   codes (see `BACKEND.md` §6).
5. Set `EXPO_PUBLIC_USE_MOCK_API=false` and `EXPO_PUBLIC_API_BASE_URL`.
6. Run `npm run typecheck` and click through every screen.

Suggested order: auth/profile → credits → **analysis lifecycle (your core)** →
history/drills.

---

## 4. The analysis lifecycle (your core area)

This is the CV/AI pipeline. It is **asynchronous: submit → poll → fetch**.

**Step 1 — `submitAnalysis(input)`** → `{ jobId }`
The user trimmed a clip, picked a stroke, and dragged 4 court-corner pins. You
deduct 100 credits and return a `jobId`.

```ts
AnalysisRequest {
  clipRef: string;            // upload reference / URI of the trimmed clip
  trimStartSec: number;
  trimEndSec: number;         // (trimEnd - trimStart) is 1–15 s
  strokeType: 'Smash' | 'Drop_Shot' | 'Clear' | 'Drive' | 'Net_Kill';
  courtCorners: { tl, tr, bl, br };   // each { x, y }, normalised 0–1
  userProfileSnapshot: { heightCm: number; favoriteProId?: string };
}
```

**Step 2 — `getAnalysisStatus(jobId)`** — the S8 screen polls this ~every 1s.

```ts
AnalysisStatusResult {
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;     // 0–1
  etaSeconds: number;
  error?: { code, messageKey, refundable };   // only when status === 'failed'
}
```

**Step 3 — `getAnalysisResult(jobId)`** → `Analysis` (call once status is `done`).

```ts
Analysis {
  id, jobId, createdAt, strokeType,
  overallScore: number,                  // 0–100, weighted average
  checkpoints: { key, score }[],         // the 7 sub-scores below
  proPlayerId: string,                   // matched pro for the S9 comparison
  userVideoUrl: string,                  // S9 left panel
  proVideoUrl: string,                   // S9 right panel
  mistakes: MistakeCard[],               // ≤5, sorted Critical → Minor
  durationSec: number,
}
```

**The 7 scoring checkpoints** (`CheckpointKey`): `grip`, `stance`, `backswing`,
`elbow`, `contact`, `weight`, `follow_through`. Each gets a 0–100 sub-score; the
overall score is their weighted average (weights vary by stroke — see
`src/constants/strokes.ts`).

**Refund rule (SPEC §6.3):** every job failure *after* the credit deduction must
set `error.refundable = true`. The app then calls `refundCredits` and shows the
user a refund toast automatically — you don't trigger the refund, but your
status response must mark it refundable.

---

## 5. Full method list (`ShuttleCoachApi`)

All async. Full spec + suggested HTTP routes in `BACKEND.md`.

| Method | Purpose |
|---|---|
| `getProPlayers()` | Pro-player roster + reference-clip coverage |
| `getUserProfile()` | Current profile, or `null` if not onboarded |
| `updateUserProfile(patch)` | Create/patch profile; **first call grants 100 free credits** |
| `signOut()` | End the session (real backend: invalidate the token) |
| `deleteAccount()` | Permanently erase the account server-side |
| `getCreditBalance()` | Current balance |
| `getTransactions()` | Credit ledger, newest first |
| `getCreditPackages()` | The 3 purchasable packages |
| `purchaseCredits(packageId)` | Process payment, add credits |
| `refundCredits(jobId, reason)` | Refund 100 credits for a failed/cancelled job |
| `submitAnalysis(input)` | Start a CV job; deduct 100 credits |
| `getAnalysisStatus(jobId)` | Poll job status / progress / ETA |
| `getAnalysisResult(jobId)` | Fetch the finished `Analysis`; save to history |
| `listAnalyses()` | All saved analyses, newest first |
| `getAnalysis(id)` | One analysis by id |
| `deleteAnalysis(id)` | Delete an analysis |
| `getDrill(drillId)` | Drill detail for the "How to Fix" sheet |

`ApiError` codes: `INSUFFICIENT_CREDITS`, `NOT_FOUND`, `JOB_NOT_DONE`,
`NETWORK_ERROR`, `NOT_IMPLEMENTED`, `UNKNOWN`.

---

## 6. Things you need to know

- **Authentication is NOT built.** `app/login.tsx` is a **mock** — email/password
  + "Continue with Google" + "Continue with LINE" buttons that just proceed; no
  credentials are checked or stored. Real auth is **yours**: add the endpoints,
  issue a session token, and wire the login screen's `proceed()` to a real
  sign-in. The "Sign up" link is also a placeholder. **LINE login** is the
  obvious primary for the Thai market. Note: a real sign-up screen is new scope —
  agree with the team who builds that UI.
- **Sample videos are placeholders.** `assets/videos/*.mp4` are generic clips,
  not badminton footage. Your backend returns real per-analysis `userVideoUrl` /
  `proVideoUrl`; the app resolves them via `resolveVideoSource()` in
  `src/constants/media.ts` (plain URLs fall straight through).
- **Onboarding gift:** `updateUserProfile` on its **first** call must create the
  profile **and** grant 100 free credits with a "Welcome Gift" transaction.
- **Analysis content language:** `MistakeCard` titles/descriptions and `Drill`
  text are analysis *content*, rendered as-is — not i18n keys. For a Thai-first
  product, return them in the user's language (send `Accept-Language` or read a
  profile locale field).
- **Credits:** one analysis costs 100 (`ANALYSIS_COST`). Charge on
  `submitAnalysis`; a pre-receipt upload failure should throw `NETWORK_ERROR` and
  **not** charge.
- **Compute:** the CV/AI job runs 30–90s and needs real (likely GPU) compute —
  this cannot run on Vercel (that hosts the front-end only). Use a GPU host /
  container + a database + object storage for clips.

---

## 7. Where things live

| Path | What |
|---|---|
| `SPEC.md` | Product spec — 15 screens, design system, flows |
| `BACKEND.md` | Formal API contract + suggested HTTP route mapping |
| `IMPROVEMENTS.md` | Review history + items still open |
| `src/services/api.ts` | The `ShuttleCoachApi` interface + `ApiError` |
| `src/services/real/realApi.ts` | **Your file** — implement here |
| `src/services/mock/` | Reference mock implementation + job simulation |
| `src/types/index.ts` | All shared TypeScript types |
| `src/constants/` | Pro players, packages, drills, tips, scoring weights |
| `src/store/` | Zustand stores (thin UI cache over the service layer) |
| `app/` | The screens (Expo Router file-based routes) |

---

## 8. Quality status (front-end)

- TypeScript strict (`tsc --noEmit`) — **0 errors**.
- Web production export (`npx expo export --platform web`) — **succeeds**.
- Full happy-path re-screenshotted headless — **0 runtime errors**.
- The app has had a 4-agent review pass and a premium design pass; see
  `IMPROVEMENTS.md`.

Questions on a specific method or type — start from `src/services/api.ts` and
`src/types/index.ts`; both are heavily commented. Good luck! 🏸

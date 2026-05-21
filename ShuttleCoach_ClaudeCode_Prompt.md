# Claude Code Prompt — Shuttle Coach MVP

> **How to use this file:** Start Claude Code inside `C:\claude-proj\shuttlecoach\mvp` and paste *everything* inside the horizontal rule below as your first message. Then let Claude Code work — answer its questions when asked.

---

You are building the front-end MVP of **Shuttle Coach**, an AI-powered badminton form-analysis mobile app. This is a real product that will be demoed to a sponsor/promoter and later shipped to the App Store and Google Play. Build it like a professional engineer would: clean, typed, well-structured, and ready for a second developer to integrate a backend.

## 0. Working directory & spec

You are already inside the project directory: `C:\claude-proj\shuttlecoach\mvp`. Scaffold the Expo app **in-place, in this same folder** — do not create a new subfolder. The folder currently contains a few Markdown files (`SPEC.md`, `ShuttleCoach_Build_Guide.md`, `ShuttleCoach_ClaudeCode_Prompt.md`, `ShuttleCoach_AgentTeam_Prompt.md`); leave them where they are. If `create-expo-app` refuses because the directory is not empty, scaffold into a temporary folder and move the generated files up into this directory, then continue.

The complete product specification is in **`SPEC.md`** in this folder. Read it fully before writing any code. It defines all 14 screens (S1–S14), the design system, user flows, states, and data models. `SPEC.md` is the source of truth — when in doubt, follow it. Keep it in the repo. (The other `ShuttleCoach_*.md` files are reference docs for the human — you may ignore them.)

## 1. Tech stack (use exactly this)

- **Expo** (latest stable SDK), **React Native**, **TypeScript** in strict mode.
- **Expo Router** for file-based navigation.
- **NativeWind v4** for styling (Tailwind for React Native).
- **react-native-reusables** for UI components — this is shadcn/ui for React Native. Install its components (Button, Card, Input, Dialog, Sheet/BottomSheet, Progress, Avatar, Badge, Tabs, Skeleton, Toast, Slider, etc.) as needed. Docs: reactnativereusables.com.
- **lucide-react-native** for icons.
- **expo-google-fonts** for Syne, Space Grotesk, DM Sans, DM Mono.
- **i18n** with `i18n-js` + `expo-localization`.
- Lightweight global state with **Zustand**.
- Enable **web support** (`react-native-web`) — the web build is the primary demo target and must deploy to Vercel.
- Animations with `react-native-reanimated`; charts with `react-native-gifted-charts` (or `victory-native`).

Scaffold with `npx create-expo-app` using a TypeScript + Expo Router template, then add the libraries above.

## 2. Build philosophy — non-negotiables

1. **The app must fully run with NO backend.** Ship a complete mock data layer so the entire happy path (and every screen) is clickable and demoable today.
2. **Every backend interaction goes through ONE typed service layer** (see §6). The promoter demo uses mock implementations; a second developer will later drop in real API calls by implementing the same interface. The UI must never call `fetch` directly.
3. **All 14 screens, fully built** — including empty, loading, and error states from `SPEC.md` §6. No "TODO" placeholder screens.
4. **Match the design system exactly** — colors, typography, spacing, radii from `SPEC.md` §5. Centralize all tokens; never hard-code a hex value in a component.
5. **Bilingual from day one** — Thai (default) + English, all copy via i18n keys. Per the spec: UX/body copy in Thai, UI labels in English. No hard-coded display strings.
6. **Professional code** — strict TypeScript, no `any`, small focused components, reusable primitives, sensible folder structure, meaningful names, brief comments where intent isn't obvious.

## 3. Project structure

```
shuttle-coach/
  app/                      # Expo Router routes
    _layout.tsx             # root: fonts, i18n, providers
    index.tsx               # S1 Splash
    onboarding/             # S2 (4 steps)
    (tabs)/                 # bottom tab bar
      _layout.tsx           # 4 tabs
      home.tsx              # S3
      wallet.tsx            # S11
      history.tsx           # S13
      profile.tsx           # S14
    upload/                 # S4–S7 modal flow (trim, stroke, court, confirm)
    processing.tsx          # S8
    analysis/[id].tsx       # S9
    wallet/transactions.tsx # S12
  src/
    components/
      ui/                   # react-native-reusables primitives
      shared/               # SponsorBadge, ScoreCircle, MistakeCard, etc.
    services/
      api.ts                # the typed backend contract (interface)
      index.ts              # exports mock or real impl based on env flag
      mock/                 # mock implementations + fixtures
    store/                  # Zustand stores (user, credits, analyses)
    theme/                  # colors, typography, spacing tokens
    i18n/                   # config + en.json + th.json
    types/                  # shared TS types (ProPlayer, Analysis, etc.)
    constants/              # static data (stroke types, packages, tips)
  SPEC.md
  README.md
  BACKEND.md
  vercel.json
```

## 4. Design system

Create `src/theme/` with the full token set from `SPEC.md` §5.2–5.4. Wire NativeWind's `tailwind.config.js` to these tokens so utility classes (`bg-navy`, `text-primary`, `rounded-card`, etc.) map to the spec. Key tokens:

- Colors: Navy `#0A1628`, Electric Blue `#2563EB`, Neon Mint `#00C896`, Fire Orange `#E84A30`, Deep Navy `#1A2236`, Slate `#64748B`, Light `#F1F5F9`, White `#FFFFFF`, Score Red `#EF4444`, Score Amber `#F59E0B`, Score Green `#22C55E`.
- Fonts: Syne ExtraBold (display/scores), Space Grotesk SemiBold/Medium (headings/labels), DM Sans (body/caption), DM Mono (numeric data).
- Spacing on an 8pt grid; radii 12/8/20/50%; primary button 56pt, secondary 44–48pt; min touch target 44×44pt.
- Light mode only (dark mode is Phase 2). Respect the system "Reduce Motion" setting.

Build the reusable components from `SPEC.md` §11 — buttons (all states), inputs, number stepper, segmented control, slider, search field, cards (Analysis Summary, Analysis History, Package, Mistake Highlight, Coaching Tip), bottom sheet, modal dialog, toast, confirmation modal, and the **SponsorBadge** (dark + light variants).

## 5. Screens — build all 14

Implement S1–S14 per `SPEC.md` §4, with the exact layouts, copy, zones, and interactive states described there. Pay special attention to:

- **S2 Onboarding** — 4-step form, progress bar, 100-free-credits gift + welcome toast on completion.
- **S4–S7 Upload flow** — full-screen modal, 4-step indicator. On the **web demo build**, since browser video trimming is limited, bundle a sample badminton clip and let the user "trim" it with the scrubber UI; the flow must still feel complete.
- **S6 Court Calibration** — 4 draggable pins (TL/TR/BL/BR) on the first frame, 44pt touch targets, faint guide overlay that disappears after the first pin moves.
- **S7 Payment Confirmation** — bottom sheet; implement the **insufficient-credits** variant (§6.4) too.
- **S8 Processing** — full custom animated screen, circular progress ring, rotating coaching tips, ~30–90s simulated duration, cancel-with-refund.
- **S9 Analysis & Comparison** — the hero screen. Split-screen synced video (user vs pro), playback controls (play/pause, frame step, speed 0.25/0.5/1.0x, scrubber), skeleton-overlay toggle, switch-pro-player, score circle that **counts up 0→final over 1.2s**, scrollable Mistake Cards that slide in staggered, tap-card-to-jump-frame, share to a branded result card. Supports landscape.
- **S10 Drill Detail** — bottom sheet, numbered steps, coach's tip box, "Coming in v2" video placeholder.
- **S13 History** — filter chips, sort control, progress delta vs previous same-stroke analysis, swipe-to-delete with confirmation.

Implement every empty state (§6.1), loading/skeleton state (§6.2), and error modal (§6.3), including the **automatic credit refund + toast** rule. Include the first-analysis confetti celebration (§6.5).

## 6. The service layer (most important — this is the backend hand-off)

A second full-stack developer will integrate the real CV/AI backend. Design for that now.

Create `src/services/api.ts` defining a single **typed interface**, `ShuttleCoachApi`, covering every backend interaction:

- `getProPlayers()` → `ProPlayer[]`
- `submitAnalysis(input: AnalysisRequest)` → `{ jobId: string }` — input carries the trimmed clip reference, stroke type, the 4 court-corner coordinates, and the user's profile (height, favorite pro).
- `getAnalysisStatus(jobId)` → `{ status: 'queued'|'processing'|'done'|'failed', progress: number, etaSeconds: number, error?: AnalysisError }`
- `getAnalysisResult(jobId)` → `Analysis` (overall score, per-checkpoint sub-scores from §8.1, matched pro, user + pro video URLs, max-5 mistake cards with severity/timestamp/drill ref).
- `listAnalyses()` / `getAnalysis(id)` / `deleteAnalysis(id)`
- `getCreditBalance()` / `getTransactions()` / `purchaseCredits(packageId)` / `refundCredits(jobId, reason)`
- `getDrill(drillId)` → drill steps + coach tip.
- `get/updateUserProfile()`

Then:
- `src/services/mock/` — a full mock implementation of `ShuttleCoachApi` using realistic in-memory fixtures and artificial delays (e.g. `submitAnalysis` + status polling simulates a 30–90s job; occasionally surface an error path for the demo of §6.3/§10.3).
- `src/services/index.ts` — exports the mock or a (stubbed) real implementation based on `process.env.EXPO_PUBLIC_USE_MOCK_API`. Default to mock. Create the real-impl file as a clearly marked stub that throws "not implemented" so the seam is obvious.
- Put all shared shapes in `src/types/` and reference them from both sides.

Document the entire contract in **`BACKEND.md`**: each method, request shape, response shape, error codes, and the polling model — written as a spec the backend developer can implement against. Note that this maps to the existing ShuttleIQ CV pipeline (video + stroke + 4 court corners → pose analysis → pro match → scored result with phase-by-phase feedback).

## 7. Mock data

Seed realistic fixtures so the demo feels real:

- The **5 Pro Players** from `SPEC.md` §7.2 with their heights, nationalities, and stroke coverage. Implement the matching logic from §7.3.
- The **3 credit packages** from §1.5; start a new user at 100 credits.
- **6–8 past analyses** of varying strokes, scores, and dates so Home, History, and progress-delta all have content — plus the ability to show empty states (provide a flag/toggle).
- A realistic completed **Analysis** result: an overall score, seven checkpoint sub-scores (§8.1), and 3–5 mistake cards with proper severity ordering, timestamps, plain-language titles/descriptions, and drill references (§8.3).
- A small **drill library** so every mistake card's "How to Fix" opens a real S10 sheet.
- Coaching tips for the Home "Tip of the Day" and the S8 rotating tips.
- A few sample transactions.
- Bundle 1–2 short sample badminton video clips in `assets/` for the upload flow and the S9 comparison player.

## 8. i18n

Set up `i18n-js` + `expo-localization`. Provide `en.json` and `th.json` with every visible string. Default to Thai; expose a language toggle in S14 Profile. Follow the spec's intent: descriptive/UX copy in Thai, short UI labels in English.

## 9. Web + Vercel

- Ensure the app runs in the browser via `npx expo start --web` and looks correct in a phone-width viewport.
- Add `vercel.json` and confirm `npx expo export --platform web` outputs to `dist/`.
- Document the Vercel settings in `README.md`: Build Command `npx expo export --platform web`, Output Directory `dist`.

## 10. Professional extras (add these — they make the demo land)

Modern sports-analysis apps (V1 Golf, Onform, SwingVision, Sportsbox AI) all do these; add them tastefully without contradicting the spec:

- A **progress chart** on the Profile or History screen — score trend over time per stroke type.
- **Streak / count stats** on Home (e.g. analyses this week) for a sense of momentum.
- Smooth **skeleton loaders** everywhere data loads (per §6.2), never bare spinners.
- Polished **micro-interactions**: the S9 score count-up, staggered card entrances, spring bottom sheets — all gated behind the Reduce Motion check.
- A subtle **achievement/badge** on the first analysis beyond the confetti (e.g. "First Analysis" badge in Profile).
- Haptic feedback on key actions (native only) via `expo-haptics`.

## 11. Documentation deliverables

- **`README.md`** — what the app is, the stack, how to run locally (web + Expo Go), how to deploy to Vercel, how to switch mock↔real API, and the path to native builds via EAS.
- **`BACKEND.md`** — the full API contract from §6, written for the backend developer.
- Keep **`SPEC.md`** in the repo.
- Add concise code comments where intent isn't obvious; every `src/services` method gets a doc comment.

## 12. Suggested work order

1. Scaffold Expo + TypeScript + Expo Router; add NativeWind, react-native-reusables, fonts, i18n, Zustand. **Confirm it runs on web before continuing.**
2. Build the theme tokens and the shared component library (§11 of the spec).
3. Build the service layer + types + mock data (§6, §7) — get the data layer solid early.
4. Build navigation: splash → onboarding → tab bar → modal flows.
5. Build screens in happy-path order: S1 → S2 → S3 → S4–S7 → S8 → S9 → S10, then S11 → S12 → S13 → S14.
6. Add all empty/loading/error states and the celebration moments.
7. Add the professional extras (§10).
8. Write `README.md` and `BACKEND.md`, add `vercel.json`.
9. Verify against the checklist in §13.
10. Push to GitHub (§14).

## 13. Definition of done

- `npx expo start --web` runs with no errors; the full happy path (`SPEC.md` §10.1) is clickable end-to-end.
- All 14 screens exist and match the spec's layout, copy, and states.
- TypeScript compiles in strict mode with no errors and no `any`.
- Zero hard-coded colors/strings in components — all via theme tokens and i18n.
- The app works entirely on mock data; no real network calls.
- The mock↔real API switch works via the env flag, with the real impl stubbed.
- `npx expo export --platform web` produces a `dist/` folder ready for Vercel.
- `README.md` and `BACKEND.md` are complete and accurate.
- The project is committed and pushed to GitHub (§14).

## 14. Push to GitHub

After the build is complete and verified, publish the project to this existing GitHub repository:

**`https://github.com/Toodmuk/shuttlecoach-mvp`**

Do the following:

1. Create a proper **`.gitignore`** for an Expo / React Native project — exclude `node_modules/`, `.expo/`, `dist/`, build artifacts, `.env*` files, and OS/editor cruft. Never commit secrets.
2. Initialize git if not already a repo, set the default branch to **`main`**, and add the remote:
   `git remote add origin https://github.com/Toodmuk/shuttlecoach-mvp.git`
3. Stage everything, make one clear initial commit (e.g. `"Shuttle Coach MVP — initial front-end build"`), and push to `main`.
4. The repo already exists and **may contain an initial commit** (e.g. a README). If the push is rejected because the remote has commits, reconcile by pulling with rebase (`git pull --rebase origin main`) and then push — keep the project's files, integrate the remote's README if present.
5. **If git authentication is not configured** and the push fails with an auth error, do NOT keep retrying. Stop, and tell me clearly that I need to authenticate — for example by signing in with the GitHub CLI (`gh auth login`) or configuring a credential helper / personal access token — then you can push. Make all commits locally regardless, so they are ready to push.
6. After a successful push, confirm the branch and remote, and remind me that connecting this repo in Vercel will give the shareable demo link (Build Command `npx expo export --platform web`, Output Directory `dist`).

Work autonomously through the whole build. If a spec detail is ambiguous, make a sensible, professional choice consistent with `SPEC.md` and note it in `README.md`. Build the entire app — do not stop at a partial prototype.

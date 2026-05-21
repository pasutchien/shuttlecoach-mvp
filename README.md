# Shuttle Coach — MVP

> AI-powered badminton form analysis. Mobile app (iOS & Android) + web demo build.
> **Presented by Banthongyord.**

Shuttle Coach lets an intermediate badminton player film a stroke, get an
AI-scored breakdown of their technique, and compare themselves frame-by-frame
against a matched professional player.

This repository is the **front-end MVP**: all 14 screens are built and fully
clickable with **no backend** — every backend interaction runs through a typed
mock service layer. A second developer integrates the real CV/AI backend by
implementing one interface (see [`BACKEND.md`](./BACKEND.md)).

The complete product specification is in [`SPEC.md`](./SPEC.md) — the source of
truth for screens, design system, flows and data models.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Expo (SDK 54), React Native 0.81, React 19 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind for React Native) |
| State | Zustand |
| i18n | `i18n-js` + `expo-localization` (Thai default, English) |
| Icons | `lucide-react-native` |
| Fonts | Syne, Space Grotesk, DM Sans, DM Mono (`@expo-google-fonts/*`) |
| Animation | `react-native-reanimated` |
| Video | `expo-video` |
| Charts / graphics | `react-native-svg` (custom components) |
| Web | `react-native-web` — the primary demo target, deploys to Vercel |

---

## Project structure

```
app/                      Expo Router routes
  _layout.tsx             root: fonts, providers, toast host
  index.tsx               S1  Splash
  onboarding/index.tsx    S2  Onboarding (4 steps)
  (tabs)/                 bottom tab bar
    _layout.tsx           4 tabs
    home.tsx              S3  Home
    wallet.tsx            S11 Wallet & Store
    history.tsx           S13 Analysis History
    profile.tsx           S14 Profile & Settings
  upload/index.tsx        S4–S7 upload + payment flow
  processing.tsx          S8  AI processing
  analysis/[id].tsx       S9  Analysis & Comparison (+ S10 drill sheet)
  wallet/transactions.tsx S12 Transaction History
src/
  components/ui/          UI primitives (Button, Card, Input, BottomSheet, …)
  components/shared/      app components (ScoreCircle, MistakeCard, SponsorBadge, …)
  services/               THE backend contract
    api.ts                ShuttleCoachApi interface + ApiError
    index.ts              exports the mock or real impl (env-driven)
    mock/                 mock implementation + fixtures
    real/realApi.ts       real-backend stub (throws "not implemented")
  store/                  Zustand stores (user, credits, analyses, upload, settings)
  theme/                  design tokens (colors, typography, spacing)
  i18n/                   config + en.json + th.json
  types/                  shared domain types
  constants/              pro players, packages, drills, tips, media
  lib/                    helpers (score, format, haptics, cn)
  hooks/                  useTranslation, useReducedMotion
assets/videos/            bundled sample clips (placeholders — see note below)
```

---

## Running locally

Prerequisites: **Node.js 20+**.

```bash
npm install
```

### Web (primary demo target)

```bash
npm run web
```

Opens at `http://localhost:8081`. Best viewed at a phone-width viewport
(the browser dev-tools device toolbar).

### iOS / Android via Expo Go

```bash
npm start
```

Scan the QR code with the **Expo Go** app. Some native niceties (haptics) are
no-ops on web and active on device.

### Useful scripts

| Command | Purpose |
|---|---|
| `npm run web` | Run the web dev server |
| `npm start` | Run the Expo dev server (QR for Expo Go) |
| `npm run typecheck` | `tsc --noEmit` — strict type check |
| `npm run build:web` | Web export to `dist/` |
| `npm run lint` | ESLint |

---

## Configuration (env flags)

Copy `.env.example` to `.env` to override defaults. All flags are optional.

| Flag | Default | Effect |
|---|---|---|
| `EXPO_PUBLIC_USE_MOCK_API` | `true` | `false` switches to the real-backend impl |
| `EXPO_PUBLIC_SEED` | `full` | `empty` starts a brand-new user (demo onboarding / empty states) |
| `EXPO_PUBLIC_MOCK_JOB_SECONDS` | `30` | Simulated AI processing duration |
| `EXPO_PUBLIC_FORCE_ANALYSIS_ERROR` | _unset_ | Force a job failure to demo error recovery (§6.3) |
| `EXPO_PUBLIC_API_BASE_URL` | _unset_ | Real backend base URL |

**Demoing different states without env changes:** the seeded build starts as a
returning user with history. Use **Profile → Sign Out** to drop back to a
brand-new user — this naturally demos the Splash → Onboarding → empty-states
path. To demo the error-recovery flow, set `EXPO_PUBLIC_FORCE_ANALYSIS_ERROR`.

---

## Switching mock ↔ real API

The entire app talks to the backend through **one interface**, `ShuttleCoachApi`
(`src/services/api.ts`). The UI never calls `fetch` directly.

- **Mock (default):** `src/services/mock/` — in-memory fixtures, artificial
  latency, a simulated 30–90s analysis job, AsyncStorage persistence.
- **Real:** implement every method in `src/services/real/realApi.ts` against the
  contract in [`BACKEND.md`](./BACKEND.md), then set
  `EXPO_PUBLIC_USE_MOCK_API=false`.

No screen or store changes are needed to switch — only the env flag.

> **Sample video clips:** `assets/videos/*.mp4` are generic placeholder clips,
> not real badminton footage. The real backend returns per-analysis video URLs;
> see `src/constants/media.ts` (`resolveVideoSource`).

---

## Deploying to Vercel

The web build is a single-page app exported to `dist/`.

1. Import the repo into Vercel.
2. Vercel reads [`vercel.json`](./vercel.json); the settings are:
   - **Build Command:** `npx expo export --platform web`
   - **Output Directory:** `dist`
   - SPA rewrite (`/(.*) → /`) so client-side routes resolve on refresh.
3. Add any `EXPO_PUBLIC_*` env vars in the Vercel project settings.
4. Deploy.

Locally you can reproduce the build with `npm run build:web` and serve `dist/`
with any static server.

---

## Native builds (EAS)

For real iOS/Android binaries:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios      # or android, or all
```

`app.json` already carries the bundle identifiers
(`com.banthongyord.shuttlecoach`). Submit with `eas submit` once builds pass.

---

## Notes & known limitations

- **Light mode only** — dark mode is Phase 2 (SPEC §9.2).
- Sample clips are placeholders (see above).
- "Reduce Motion" is respected app-wide; animations gate on it.
- The S9 Analysis screen supports landscape; other screens are designed
  portrait-first.

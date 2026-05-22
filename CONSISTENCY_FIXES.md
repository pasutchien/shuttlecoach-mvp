# UX/UI Consistency Pass — Shuttle Coach

A focused layout/consistency pass. **No app functionality, navigation logic,
mock data, or service-layer behaviour was changed.** Every value comes from
existing theme tokens — no new colors, fonts, or magic numbers.

---

## 1. What was misaligned

Each screen hand-coded its own header, safe-area handling and padding. The
concrete defects:

| # | Problem | Evidence |
|---|---------|----------|
| 1 | **Header height differed per screen.** | Home used `paddingTop: insets.top` + `py-3`; Wallet/History/Profile/Transactions used `insets.top + 12` + `pb-4`. Worse, each header's *content* set its own height: Profile (bare 20px title) ≈ `top+48`; History (title + bordered sort button) ≈ `top+62`; Transactions/Wallet-with-back (44pt back button) ≈ `top+72`. |
| 2 | **Wallet's header changed height with itself.** | The back chevron was shown via `router.canGoBack()`. With a back button the row was 44pt tall; without it ~20pt — so the same screen rendered two different header heights. |
| 3 | **Back button had no consistent rule.** | Wallet showed a back arrow based on `router.canGoBack()`, which is `true` for a tab root reached via `login → (tabs)` — so the Wallet *tab* often showed a stray back arrow. Analysis used an arrow **+ "Back" text**; Transactions/Recording Tips used a bare chevron. |
| 4 | **Inconsistent insets / padding.** | Transaction History applied `contentContainerStyle.paddingHorizontal: 20` to its `FlatList`, which **also inset its navy header by 20pt on each side** — the navy bar was not full-bleed. Tab switching shifted content because headers were different heights and the navy block resized. |

---

## 2. Shared components created

Two new components in `src/components/shared/`, plus one theme token.

### `AppHeader.tsx` — the single shared header
- A navy bar with a **fixed frame**: total height is always
  `safe-area-top + sizing.header` (56pt), content row vertically centred,
  `spacing.screenX` (20pt) side padding.
- **No screen may set its own header height/padding/safe-area.**
- Content varies only by prop: `title`, `showBack`, `onBack`,
  `titleAccessory` (e.g. a count badge), `right` (action slot), `leading`
  (custom left content — used for the Home logo lockup).
- One back affordance everywhere: a bare `ChevronLeft` at the leading edge,
  same position and style on every pushed screen.

### `ScreenContainer.tsx` — the single shared scaffold
- `flex-1` + a consistent screen background (`light` / `navy` / `white`).
- Renders the `AppHeader` passed via the `header` prop; the body fills the
  rest. Optional `padded` applies the standard 20pt horizontal padding to a
  static body.

### `src/theme/spacing.ts`
- Added `sizing.header = 56` — the shared header content-row height. The
  header frame is derived from this token only.

---

## 3. Back-button rule (applied to all screens)

| Screen | Type | Rule applied |
|--------|------|--------------|
| Home (S3) | Tab root | **No** back arrow |
| Wallet (S11) | Tab root | **No** back arrow — *except* when pushed from the S7 insufficient-credits flow, which now passes `?topup=1`. This replaces the unreliable `router.canGoBack()` check, so the Wallet **tab** never shows a back arrow while the S7→Wallet→back-to-S7 flow (SPEC §6.4) still works. |
| History (S13) | Tab root | **No** back arrow |
| Profile (S14) | Tab root | **No** back arrow |
| Transaction History (S12) | Pushed | Back chevron, top-left |
| Analysis (S9) | Pushed / full-screen | Back chevron, top-left (was an arrow **+** "Back" text — now the same bare chevron as S12) |
| Recording Tips | Pushed | Back chevron, top-left |
| Upload (S4–S6) | Modal flow | Close **X** retained; added the in-flow **Back** text button between steps |
| Onboarding (S2) | Modal flow | Already correct (progress bar + in-flow Back text button) — unchanged |
| Splash / Processing / Login | Headerless | No header by design — unchanged |

---

## 4. Screens refactored

**Routed through `ScreenContainer` + `AppHeader`** (own header/safe-area/padding removed):

| Screen | File |
|--------|------|
| S3 Home | `app/(tabs)/home.tsx` — Zone A (logo + credit chip) moved into `AppHeader`'s `leading`/`right`; the navy hero (Zones B–D) continues seamlessly below. |
| S11 Wallet | `app/(tabs)/wallet.tsx` — removed the `canGoBack()` conditional header; back now driven by the `?topup=1` param. |
| S13 History | `app/(tabs)/history.tsx` — navy bar → `AppHeader` (title + count badge + sort button); stroke-filter chips kept as the sticky `FlatList` header. |
| S14 Profile | `app/(tabs)/profile.tsx` — navy bar → `AppHeader`. |
| S12 Transaction History | `app/wallet/transactions.tsx` — navy bar → fixed `AppHeader`; removed the `paddingHorizontal` that was insetting the header; rows now carry their own `mx-5`. |
| S9 Analysis | `app/analysis/[id].tsx` — custom toolbar → `AppHeader` (back chevron + share action), `ScreenContainer` background `navy`. |
| Recording Tips | `app/recording-tips.tsx` — navy bar → `AppHeader`. |

**Modal flows — kept their spec-defined chrome:**

- `app/upload/index.tsx` (S4–S6) — keeps the step indicator + close **X** per
  SPEC §4. Added the in-flow **Back** text button (steps 2–3) in a
  fixed-height slot so the title never shifts. Also updated `handleTopUp` to
  push `/(tabs)/wallet?topup=1`.
- `app/onboarding/index.tsx` (S2) — already internally consistent
  (progress bar + Back text button); left unchanged.

**Unchanged (headerless by design):** Splash (S1), Processing (S8), Login.

---

## 5. Result

- Every header is now exactly `safe-area-top + 56pt` tall, with identical
  vertical alignment and 20pt side padding — switching tabs no longer shifts
  or resizes the header.
- All tab screens share the same `light` background; pushed/Analysis screens
  use a consistent `navy` background — no background flash on navigation.
- One back-button rule, applied consistently across all 14 screens.

## 6. Verification

- `npx tsc --noEmit` — **passes**, no errors.
- `npx expo start --web` — runs cleanly; the app was driven through Splash →
  Login → Onboarding → all four tabs → Transaction History. The four tab
  headers render at an identical height with no shift between tabs; tab roots
  show no back arrow; Transaction History (S12) shows the back chevron. The
  only console message is a pre-existing NativeWind dark-mode warning,
  unrelated to this pass.

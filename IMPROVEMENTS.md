# Shuttle Coach MVP — Improvements (Agent-Team Review Pass)

A four-agent review (trend-researcher, ux-reviewer, code-reviewer, a11y-perf-auditor)
audited the MVP. This file is the synthesized, de-duplicated, prioritized result.

Items are grouped:

1. **✅ Implemented in this pass** — High-priority Safe items + quick Medium Safe wins.
2. **⏳ Needs your approval** — Risky, larger, or product-decision items left untouched.
3. **🔵 Considered — intentionally not changed** — flagged by a reviewer but the
   current behavior is correct per `SPEC.md`.

Priority = value · Effort = rough size · Risk = Safe / Needs care / Risky.

---

## 1. ✅ Implemented in this pass

Highest-value, lowest-risk first.

| # | Improvement | Raised by | Why it matters | Priority | Effort | Risk |
|---|---|---|---|---|---|---|
| 1 | **Route hardcoded English strings through i18n** — `"You"` (S9 video label), `"Top mistake"` (share card), `"Delete"` (S13 swipe action), the first-analysis badge subtitle. | ux, code | These bypassed i18n entirely and showed English in Thai locale, breaking the Thai-first promise (SPEC §2.3). | High | S | Safe |
| 2 | **Fix `hasSuficientCredits` typo** → `hasSufficientCredits` in the S7 payment sheet. | ux, code | Misspelled identifier on the core payment guard; trips up grep/autocomplete. | High | XS | Safe |
| 3 | **Use `ANALYSIS_COST` constant instead of the literal `100`** across the S7 payment sheet (balance check, shortfall, label). | code (H2) | If the cost ever changes, the UI would show a wrong number while the backend charges the right one. | High | S | Safe |
| 4 | **Clear `loadPromise` in `resetDb()`** (mock DB). | code (H3) | Latent race: a stale resolved load promise could be returned after sign-out. | High | XS | Safe |
| 5 | **Versioned mock-DB persistence** — `MockDb` carries a `schemaVersion`; a missing/mismatched version falls back to a fresh seed instead of loading a structurally-stale object. | code (H4) | Prevents runtime crashes when the persisted schema evolves during development. | High | S | Safe |
| 6 | **Pre-compute the History progress delta in a single `useMemo` map** (was O(n²) per render). | code (M5), a11y (P-2) | Each card scanned the whole list every render; now one pass. Identical output. | High | S | Safe |
| 7 | **Touch targets ≥44×44pt** — `hitSlop` on `Chip` (28pt) and `NumberStepper` buttons (40pt). | a11y (A-2, A-3) | SPEC §5.4/§9.3 require 44pt minimum; these were below it. | High | S | Safe |
| 8 | **`Slider` accessibility** — `accessibilityRole="adjustable"`, label and `accessibilityValue`. | a11y (A-4) | The experience-level slider was invisible to VoiceOver/TalkBack. | High | S | Safe |
| 9 | **Pressable `Card` accessibility label** — `Card` accepts `accessibilityLabel`; analysis summary/history cards pass a descriptive label. | a11y (A-5) | Screen readers announced bare "button" for every analysis card. | High | S | Safe |
| 10 | **Accessibility labels on Profile / onboarding Pressables** — Sign Out, Delete Account, About; weight checkbox role → `checkbox` with `checked` state. | a11y (A-6) | Unlabeled destructive actions; wrong ARIA role on the weight toggle. | High | S | Safe |
| 11 | **Caption-text contrast fix** — the `caption` text variant darkened to meet WCAG AA (4.5:1); the S8 cancel link no longer uses `text-slate/70` (~2.1:1). | a11y (A-1) | 12pt secondary text at `#64748B` on white was ~3.0:1 — a WCAG AA fail. | High | S | Safe |
| 12 | **Camera-angle guide in S4 (Trim)** — renders the existing `upload.cameraGuide` copy as an info card before trimming. | ux (#5), trend (#1) | SPEC §9.1 explicitly requires a camera-angle guide in S4; users were filming blind and risking wasted credits. | High | S | Safe |
| 13 | **Onboarding progress bar shows the Mint "completed" state** — segmented bar (completed = mint, active = blue, remaining = light). | ux (#6) | SPEC §4 S2 specifies three states; the single blue bar showed only one. | Medium | S | Safe |
| 14 | **Hide Home stat cards on cold start** — the stat row renders only when `analyses.length > 0`. | ux (#18) | New users saw "0 / — / —" stacked above the empty state — two conflicting "empty" signals. | Medium | XS | Safe |
| 15 | **Store hydration guard** — `credits`/`analyses` stores expose a `hydrated` flag; Home only re-hydrates if needed. | code (M4) | Home re-fetched on every mount, doubling calls (and, with a real backend, real requests). | Medium | S | Safe |
| 16 | **`EditProfileForm` calls `useTranslation()` itself** instead of receiving `t` as a prop. | code (M6) | Removes an implicit re-render contract; matches every other component. | Medium | S | Safe |
| 17 | **Processing tips no longer clip in Thai** — tip `numberOfLines` raised 3 → 5. | ux (#19) | Thai text runs ~1.5× longer; tips were cut off mid-sentence on small screens. | Medium | XS | Safe |
| 18 | **Splash sponsor badge double-animation removed** — one fade-in, not two. | ux (#24) | The badge had both an `entering` animation and an opacity animation. | Medium | XS | Safe |
| 19 | **Stable list keys / safe narrowing** — `ProgressChart` x-labels keyed by value; `AnalysisHistoryCard` drops the `as number` cast. | code (M7, L6) | Index keys are a diffing hazard; the cast masked proper type narrowing. | Low | XS | Safe |
| 20 | **S8 poll re-render checked** — confirmed React 19 auto-batches the two poll `setState`s (progress + ETA) into one render; no change needed. | a11y (P-3) | No extra render churn. | Low | — | Safe |
| 21 | **Payment-method copy** — "Secure payment via Shuttle Pay" → real methods ("PromptPay · Visa · Mastercard"). | ux (#10) | "Shuttle Pay" is a fictional gateway; a fake processor name erodes trust at the point of purchase. | Medium | XS | Safe |
| 22 | **Reuse the shared `cardShadow`** for the Home empty-state card; note the reserved `drill-footwork` fixture. | a11y (P-6), code (L7) | Removes a duplicated inline shadow object and clarifies an unreferenced fixture. | Low | XS | Safe |

---

## 2. ⏳ Needs your approval

Not implemented — these are Risky, larger refactors, feature additions, or product
decisions. None of them is required for the demo to work.

### Architecture / code

| Improvement | Raised by | Why it matters | Priority | Effort | Risk |
|---|---|---|---|---|---|
| **Promote sign-out / delete-account to `ShuttleCoachApi`** — `resetDb` is mock-specific but leaks into `src/services/index.ts` and the user store. Adding `signOut()` / `deleteAccount()` interface methods removes the only mock coupling in UI code. | code (H1) | Cleaner backend seam; but it changes the documented API contract (and `BACKEND.md`). | High | M | Needs care |
| **Replace dynamic i18n keys with typed lookup maps** — `` t(`stroke.${x}`) `` etc. across ~6 files become `Record<EnumType, string>` maps. | code (M1) | Compile-time exhaustiveness; today a bad key silently renders the raw string. Multi-file refactor. | Medium | M | Needs care |
| **Virtualize the History & Transactions lists** — `.map()` in a `ScrollView` → `FlatList`. | a11y (P-1) | Scales better; but introduces layout risk with the swipeable rows + headers. Low urgency at MVP data volumes. | Medium | M | Needs care |
| **Rewrite `ScoreCircle` count-up with Reanimated** — currently `requestAnimationFrame` + `setState` (~60 re-renders). | code (L2) | UI-thread animation, zero re-renders; needs care on the key delight moment. | Low | M | Needs care |

### UX / SPEC gaps

| Improvement | Raised by | Why it matters | Priority | Effort | Risk |
|---|---|---|---|---|---|
| **S9 video area 38% → ~60%** of screen height. | ux (#12) | SPEC §4 S9 says the split video is the "Top (60%)"; current 38% under-sells the comparison. Risk: squeezes the playback controls. | Medium | M | Needs care |
| **S8 shuttlecock-trajectory particle background.** | ux (#8) | SPEC §4 S8 calls for a "subtle animated particle effect"; currently plain navy. A new animation feature. | Medium | M | Needs care |
| **S7 → S11 → S7 top-up return flow** (SPEC §6.4 "Back returns to S7 with updated balance"). | ux (#4) | The payment sheet should re-focus after a top-up; needs navigation-flow work. | Medium | M | Needs care |
| **History tab unread-result badge** (SPEC §3.2). | ux (#3) | Needs a new "unread" data model on analyses. | Medium | M | Needs care |
| **Thai translation of UI labels** — tab bar, filter chips, checkpoint & severity names. | ux (#14–16) | A reviewer flagged these; **however** SPEC §2.3 explicitly says "UI labels in English". This is a product decision — see §3 below. | Low | M | Needs decision |

### Feature ideas (trend research — all mock-data-safe unless noted)

| Idea | Why it matters | Priority |
|---|---|---|
| **Onboarding value-teaser** — a 3-frame preview carousel before the data form. | Front-loads the "aha" moment; top retention lever in 2026 onboarding research. | High |
| **Weekly streak / goal ring on Home.** | Streaks are the #1 re-engagement mechanic for sub-daily-use sports apps. | High |
| **Share result as an image** (`react-native-view-shot`) instead of plain text. | SPEC §2.3 wants a highly shareable card for LINE/Facebook; text doesn't go viral. | High |
| **Radar/spider chart for the 7 checkpoints** on S9. | Industry-standard, memorable, screenshot-friendly multi-axis view. | Medium |
| **Stroke-specific processing tips** (expand the 5-tip pool, key by stroke). | Generic tips during a paid wait feel like dead time. | Medium |
| **Per-stroke filter on the Profile progress chart.** | Mixing stroke types makes the trend line meaningless. | Medium |
| **Expanded achievements** (5–6 badges derivable from local data). | A single badge has no growth loop. | Medium |
| **Low-balance urgency signal** on Home credit chip / Wallet. | Standard freemium nudge; converts low-intent users. | Medium |
| **Standalone "Recording Tips" screen** (today only reachable from error modals). | Proactive education reduces failed uploads and refunds. | Medium |
| **Referral credits** ("invite your ก๊วน, both get 50 credits"). | Peer referral fits the Thai group-play persona; redemption needs a backend. | Low |
| **Dark mode** for the light list screens (S9 is already dark). | 81.9% of Android users prefer dark mode; SPEC defers it to Phase 2. | Low |

---

## 3. 🔵 Considered — intentionally not changed

Reviewer-flagged, but the current behavior is correct per `SPEC.md`:

- **Score circle uses a 3-band colour (green ≥80 / amber 50–79 / red <50).** A
  reviewer suggested a 4-band scheme, but SPEC §4 S3 and S9 explicitly specify
  this exact 3-band mapping for the score badge. The 4-band scheme (§8.2) is the
  qualitative *label*, which `scoreBand()` already implements separately.
- **Toast uses a single dark pill for all tones.** SPEC §11.4 specifies one pill
  style (`#0F172A`); only the accent text colour varies. Left as specified.
- **Tab bar / filter labels in English under Thai locale.** SPEC §2.3:
  "UX copy in Thai, UI labels in English." Kept deliberately — see §2 for the
  open product decision.

# Shuttle Coach — MVP Application Specification (v3.0)

> AI-Powered Badminton Form Analysis · Mobile App (iOS & Android)
> Presented by Banthongyord · May 2026 · Bangkok, Thailand
>
> This file is the single source of truth for the build. Read it fully before writing code.

---

## 1. Product Overview

### 1.1 Core Concept
Shuttle Coach is a mobile app for intermediate badminton players who have hit a "Learning Plateau" — they play regularly but cannot identify or correct technique flaws without a personal coach. The app uses AI and Computer Vision to record, analyze, and compare a player's stroke against professional-level reference footage, delivering a precise, actionable breakdown of every mistake.

### 1.2 Problem Statement
Target user: a recreational badminton player aged 22–40, playing 2–4 sessions per week. They know their form is wrong but cannot identify what to change, cannot afford private coaching (800–2,500 THB/session), have no objective feedback, and cannot translate YouTube tutorials to their own body in real time.
Core pain: *"I know my form is wrong, but I don't know how to fix it."*

### 1.3 Solution — a three-step loop
1. Player films themselves performing a stroke at a badminton court.
2. AI analyzes pose, angles, timing, and court positioning frame-by-frame.
3. Player receives a score, mistake highlights, and step-by-step coaching tips — compared side-by-side against a matched Pro Player.

### 1.4 Sponsor Attribution
All screens, marketing, and the loading splash include: **"Presented by Banthongyord"**.
The sponsor badge appears on: Splash Screen, Home header, Analysis Result screen footer, and all share/export cards. Color: orange (#E84A30) on white, or white on dark backgrounds.

### 1.5 Business Model
Token-based credit system. Users buy credits to unlock AI analyses.
Cost per analysis: **100 Credits**. Payment methods: PromptPay QR Code, Credit/Debit Card via payment gateway.
**Onboarding Gift:** every new user receives **100 Free Credits** on completing profile setup — enough for one free analysis.

| Package | Credits | Price (THB) | Savings | Best For |
|---|---|---|---|---|
| Single Match | 100 | 20 | — | Casual / try it out |
| Practice Pack | 500 | 90 | 10% | Regular players (2x/week) |
| Pro Pack | 1,200 | 200 | 20% | Dedicated improvers |

---

## 2. Target User Personas

### 2.1 Primary — "Phi Ping" (The Recreational Improver)
| Attribute | Detail |
|---|---|
| Age | 22–40 |
| Play frequency | 2–4 sessions/week (ก๊วน / social group play) |
| Skill level | Intermediate — knows basics, hitting a plateau |
| Primary pain | Wants to improve, no access to affordable coaching |
| Motivation | Stop losing to the same people; develop a more powerful game |
| Device behavior | iPhone or Android; records on WhatsApp / LINE |
| Budget | 20–90 THB/session if results are visible |
| Location (beachhead) | Bangkok, Thailand |

### 2.2 Secondary — "The Self-Taught Grinder"
Played 3–7 years, developed habitual bad technique, never had formal coaching. Wants to unlearn/relearn specific strokes with data-driven guidance.

### 2.3 Persona Insights (must drive all design decisions)
- Users film at courts — design for bright lighting and variable phone angles.
- Users are not tech-savvy; UI must require zero onboarding explanation.
- Thai is primary; **UX copy in Thai, UI labels in English**.
- Users share results on LINE and Facebook — make the result card highly shareable.
- Users lose motivation if feedback is harsh — use encouraging language even for low scores.

---

## 3. App Structure & Navigation

### 3.1 Platform
iOS (iPhone, iOS 16+) and Android (Android 10+). Interaction is **thumb-first** — all critical actions reachable one-handed in the bottom two-thirds of the screen.

### 3.2 Bottom Tab Bar (4 tabs, persistent)
Always visible except during: full-screen video playback, the Camera/Upload flow, and the Analysis results screen (a floating back button replaces it).

| Tab | Icon | Label | Badge |
|---|---|---|---|
| 1 | Home / House | Home | None |
| 2 | Wallet / Credit card | Wallet | Credit balance as numeric badge |
| 3 | Clock / History | History | Unread result count (red dot) |
| 4 | Person / Profile | Profile | None |

Active tab: icon + label in Electric Blue (#2563EB). Inactive: Slate (#64748B). Tab bar: white background, thin top border (#CBD5E1), height 83pt on iPhone (includes safe area).

### 3.3 Screen Inventory
| # | Screen | Tab / Flow | Trigger |
|---|---|---|---|
| S1 | Splash Screen | App launch | App open |
| S2 | Onboarding — Profile Setup | First launch only | After splash (new user) |
| S3 | Home | Tab 1 | Tab tap |
| S4 | Video Upload — Step 1: Trim | Modal over Tab 1 | CTA on Home |
| S5 | Video Upload — Step 2: Stroke Type | Modal over Tab 1 | After trim |
| S6 | Video Upload — Step 3: Court Calibration | Modal over Tab 1 | After stroke select |
| S7 | Payment Confirmation | Bottom Sheet | After court calibration |
| S8 | AI Processing / Loading | Full screen | After payment confirm |
| S9 | Analysis & Comparison | Full screen | After AI processing |
| S10 | How To Fix (Drill Detail) | Sheet from S9 | Tap "How to Fix" card |
| S11 | Wallet & Store | Tab 2 | Tab tap / insufficient credits |
| S12 | Transaction History | Within Tab 2 | Tap "History" in Wallet |
| S13 | Analysis History | Tab 3 | Tab tap |
| S14 | Profile & Settings | Tab 4 | Tab tap |

---

## 4. Screen Specifications

### S1 — Splash Screen
Brand moment + auth check. Shown 2 seconds on every app open.
- Background: full-screen Deep Navy (#0A1628) gradient to Navy (#1A2236).
- Center logo: "Shuttle Coach" wordmark in Electric Blue (#2563EB), bold, 36pt.
- Tagline: "Perfect Your Form. Powered by AI." — Off-White, 14pt, centered, below logo.
- Sponsor badge: "Presented by BANTHONGYORD" — Fire Orange (#E84A30), 12pt, centered, 40pt below tagline.
- Animation: logo fades in (0–0.6s), tagline (0.6–1.0s), sponsor badge (1.0–1.4s), hold 0.6s, transition.
- Transition: new user → S2 Onboarding; returning user → S3 Home. Fade transition.

### S2 — Onboarding: Profile Setup
First launch only. Multi-step form with a linear progress bar at top. Active step: Blue. Completed: Mint Green. Remaining: Light (#F1F5F9).

- **Step 1 of 4:** Full name (text field), Display name (optional text field).
- **Step 2 of 4:** Height in cm (number input + stepper) — *required* for swing arc calculation. Weight in kg (optional number input).
- **Step 3 of 4:** Favorite Pro Player (searchable dropdown — see §7). Play style: Singles / Doubles / Both (segmented control).
- **Step 4 of 4:** Experience level (5-option slider: Beginner → Intermediate → Advanced). Primary goal: multi-select chips (Improve Smash / Develop Drop Shot / Improve Footwork / Consistency / All-round).

Copy: Headline "Set Up Your Athlete Profile". Subheadline "Help Shuttle Coach tailor your analysis to your body and goals." Height label "Your Height (cm)" with tooltip "Used to calculate your ideal swing arc". Back = text button top-left. Next = "Continue", full-width primary, disabled until required fields filled. Final step CTA = "Start Using Shuttle Coach", Fire Orange background. No skip option.

Post-submit: user receives 100 Free Credits; toast "Welcome! You have received 100 free Credits to try your first analysis."; navigate to S3 Home.

### S3 — Home Screen
Command center. Lands here after every app open. Must drive the core action: uploading a new clip.

| Zone | Content |
|---|---|
| A: Header bar | Left: small Shuttle Coach logo. Right: Credit balance chip (coin icon + number + "Credits", taps to S11). Background: Deep Navy (#0A1628). |
| B: Sponsor strip | Thin bar: "Presented by BANTHONGYORD" centered, orange. Height 28pt, slightly lighter navy. |
| C: Hero Section | Headline "Ready to perfect your game?" (white, 24pt bold). Subtext "Upload a clip. Get your AI coaching report in under 60 seconds." (slate, 14pt). |
| D: Primary CTA | Button "Upload New Clip" — full-width (90%), Fire Orange, white text, 18pt bold, 56pt height, 12pt radius, video-camera icon left. The single most important element on screen. |
| E: Recent History | Header "Recent Analyses" + "See All" link (blue, right). Horizontal scroll row of Analysis Summary Cards. Empty → Empty State. |
| F: Tip of the Day | Optional "Coaching Tip of the Day" card, subtle background, not interactive in MVP. |

Hero (Zone C + D) must occupy ≥35% of visible screen. Nothing interactive between Zone C and D.

**Analysis Summary Card:** 160×120pt, 10pt radius. Thumbnail (first frame, top 60%). Stroke-type pill badge over thumbnail. Date (11pt slate). Score (large 0–100, color: green 80+, orange 50–79, red <50). Pro player avatar + name (11pt).

### S4–S7 — Video Upload & Payment Flow
A 4-step full-screen modal triggered by "Upload New Clip". Close (X) top-right. Step indicator at top: "1 Trim → 2 Stroke → 3 Court → 4 Confirm". Active: filled blue circle. Completed: check + mint. Upcoming: empty slate circle.

#### S4 — Step 1: Trim Video
- Video player at top 50%, tap to play/pause, shows timestamp.
- Below: full-width timeline scrubber with two draggable handles (start/end), 44pt touch targets, blue. Selected region in light blue, unselected dimmed.
- Duration counter: "Selected: X.X seconds" — real-time.
- Instruction: "Select the clip from the moment your opponent hits the shuttle until you finish your swing."
- Validation: min 1s, max 15s. Outside range → Continue disabled + warning "Please select between 1–15 seconds."
- Continue: full-width primary blue, 56pt, enabled only when valid.

#### S5 — Step 2: Select Stroke Type
- 2-column grid of stroke option cards: icon illustration + stroke name + brief Thai description.
- 5 options: Smash (ตบ) / Drop Shot (หยอด) / Clear (โด่ง) / Drive (ดาด) / Net Kill (แย็บ).
- Selected: 3pt solid blue border, light blue tint, checkmark top-right.
- Instruction: "Select the stroke type so the AI compares you against the right Pro Player reference."
- Continue enabled only after one option selected.

#### S6 — Step 3: Court Calibration
- Full-width image: first frame of the trimmed clip. Non-interactive except pins.
- 4 draggable orange-circle pins on the court's inner corners, 44pt touch targets, labeled TL, TR, BL, BR. Initially placed at AI-estimated corners; user adjusts.
- Instruction: "Drag the 4 pins to the inner corners of the court. This helps the AI calculate accurate depth and distances."
- Faint rectangular guide overlay; disappears after first pin moved.
- Continue: enabled at all times (calibration is best-effort, not gating).

#### S7 — Payment Confirmation (Bottom Sheet)
- Slides up after Continue on Step 3. Height 50%, white, 20pt top radius, dimmed overlay behind.
- Title "Confirm Analysis".
- Summary rows: Clip duration "X.X seconds" / Stroke type / Pro Player matched / Cost "-100 Credits" (orange).
- Credit balance row: "Your balance after: XXX Credits" — green if sufficient, red if not.
- Primary CTA: "Confirm & Start Analysis (100 Credits)" — full-width, Fire Orange, 56pt.
- If balance < 100: primary button becomes "Top Up Credits" (→ S11); confirm button hidden. Warning above CTA: "You need 100 Credits. Your balance: XX Credits. Shortfall: XX Credits."
- Cancel: text link below CTA, slate; dismisses sheet, returns to Step 3.

### S8 — AI Processing / Loading
Full-screen. User has paid; maintain trust and reduce perceived wait.
- Background: Deep Navy + subtle animated particle effect (shuttlecock trajectory).
- Central circular progress ring fills over 30–90s. Inside: animated pose-skeleton figure.
- Headline "Analyzing your form..." (white, 22pt, centered).
- Rotating subtext: every 8s rotate 5 coaching tips, e.g. "Tip: A powerful smash starts with the backswing, not the swing." (slate, 13pt).
- Progress label "Estimating completion: ~45 seconds remaining" — updates every 5s.
- Cancel: small "Cancel Analysis" link → confirmation modal "Are you sure? Your 100 Credits will be refunded." (Cancel / Refund & Exit).
- On failure: auto-transition to error state (§6.3).

### S9 — Analysis & Comparison
The core value-delivery screen. Visually impressive, information-dense but navigable. Supports landscape (wider split-view); all other screens portrait-locked.

| Region | Content |
|---|---|
| Top (60%) | Split-screen video: LEFT = user's video, RIGHT = matched Pro Player's video, synchronized, play simultaneously. |
| Playback controls | Play/Pause (center), Frame-back / Frame-forward (1 frame), Speed 0.25x / 0.5x / 1.0x (default 0.5x), full-width timeline scrubber. |
| Toggle bar | [Switch Pro Player] button · [Skeleton Overlay On/Off] toggle. Both affect both panels. |
| Score badge | Circular badge top-left of user video, 0–100. Green 80+, amber 50–79, red <50. |
| Bottom (40%) | Scrollable list of Mistake Highlight Cards. |

**Mistake Highlight Card:** full width (minus 32pt padding). Content: error-type icon + bold title + 1–2 sentence plain-language description + severity chip (Minor/Major/Critical) + "How to Fix" button. Left border accent: blue (Critical), amber (Major), grey (Minor) — 4pt.
Example: Title "Contact Point Too Low" · Description "Your racket hit the shuttle 15 cm below the optimal contact zone. This reduces power and control." · Severity Major · Button "How to Fix".
Tap card (not button) → both videos jump to the exact mistake frame; frame flashes red. "How to Fix" → opens S10.
Variable text length: titles/descriptions truncate at 2 lines with "Read more" expand. Cards not fixed-height.

Toolbar: Back top-left "< Back" → Home (tab bar reappears). Share top-right → generates branded result card image (score, stroke type, top mistake, logo, "Presented by Banthongyord" badge) for LINE/WhatsApp/Instagram. Auto-saved; "Saved to History" toast for 2s after load.

### S10 — How To Fix (Drill Detail Sheet)
Bottom sheet from S9. Height 75%, scrollable, white, 20pt top radius.
- Header: mistake title (bold 18pt) + close (X) top-right.
- Drill name: "Drill: [Name]" — blue, 14pt.
- Step-by-step: numbered list of 3–5 steps; each = circled blue number + plain, actionable instruction.
- Pro tip box: highlighted box, mint left border — "Coach's tip: [1-sentence advice]".
- Related video: placeholder card "Video demonstration — Coming in v2" (dimmed; no playback in MVP).
- Done: "Got it, Back to Analysis" — full-width blue, 56pt; returns to S9 at the same frame.

### S11 — Wallet & Store
Reached via Tab 2 or "Top Up Credits" CTA.
- Zone A — Balance Card: large card, current balance in large numerals. Sub-line "1 Analysis = 100 Credits". "Transaction History" link (right) → S12.
- Zone B — Package Grid: label "Buy Credits". 3 purchase cards (2 per row; Pro Pack full-width to feel premium).
- Zone C — Payment methods: PromptPay + Visa/Mastercard logos. Label "Secure payment via [gateway name]".

**Purchase Card:** Credit amount (large bold blue) + price THB + savings badge (green pill, if any) + "Buy Now" button (full-width orange, in card).
- Single Match: 100 Credits / 20 THB / no badge.
- Practice Pack: 500 Credits / 90 THB / "Save 10%".
- Pro Pack: 1,200 Credits / 200 THB / "Save 20%" + "Most Popular" diagonal orange ribbon. Must visually dominate.

### S12 — Transaction History
Full-screen push from S11, back button top-left.
- List item: date + type ("+500 Credits — Practice Pack" or "-100 Credits — Smash Analysis") + balance after. Added = green (+), spent = red (–).
- Filter: segmented control All / Purchases / Analyses.
- Empty: "No transactions yet. Buy credits to get started." + illustration + "Buy Credits" CTA → S11.

### S13 — Analysis History
Tab 3. Full log of past analyses to track improvement.
- Header "Your Analyses" + total count badge.
- Filter row: horizontal scroll chips All / Smash / Drop Shot / Clear / Drive / Net Kill.
- Sort control top-right: "Sort by: Date ▼" — Date (newest), Score (highest), Stroke Type.
- Vertical list of Analysis History Cards.

**Analysis History Card:** horizontal, full-width, 80pt. Left: video thumbnail 80×80pt, 8pt radius. Right: stroke type + date + score + Pro Player compared. Score circle, color-coded as S9. Progress indicator: if the same stroke was analyzed before, show delta ("+12 points since last Smash analysis") green/red with arrow. Tap → opens that historical S9. Swipe left → "Delete" (red), requires confirmation modal.

### S14 — Profile & Settings
Tab 4.
- Profile header: initials-based avatar (auto color) + display name + "Edit Profile" button.
- Physical Stats: Height (editable) + Weight (editable, optional) — "Height: 175 cm | Weight: 70 kg".
- Athletic Preferences: Favorite Pro Player (editable dropdown) + Play Style + Experience Level.
- Notification Settings: toggle "Analysis complete notifications" (default ON) + "Weekly progress summary" (default ON).
- Account: "Sign Out" (red text button); "Delete Account" (destructive, confirmation required).
- About: "About Shuttle Coach" link + "Presented by Banthongyord" credit line + version number.

---

## 5. UX/UI Design Guidelines

### 5.1 Design Principles
- **Thumb-first:** primary actions in the bottom two-thirds. No important actions in top corners.
- **One job per screen:** one primary action; secondary actions never more prominent.
- **Trust through clarity:** the user paid Credits — every result screen must feel authoritative and complete.
- **Celebrate improvement:** encouraging language. A score of 45 should feel like "here's exactly how to reach 60", not a failure.
- **Sponsor integration without intrusion:** sponsor line appears on key screens but never disrupts flow.

### 5.2 Color System
| Token | Hex | Usage |
|---|---|---|
| Navy (Primary BG) | #0A1628 | App background, headers, splash |
| Electric Blue (Primary) | #2563EB | Primary buttons, active states, links, highlights |
| Neon Mint (AI / Success) | #00C896 | AI elements, success badges, score 80+ |
| Fire Orange (CTA / Sponsor) | #E84A30 | Upload CTA, sponsor badge, most important actions |
| Deep Navy (Card BG) | #1A2236 | Card surfaces on dark backgrounds |
| Slate (Secondary Text) | #64748B | Secondary labels, hints, placeholders |
| Light (Background) | #F1F5F9 | Light-mode screen background |
| White (Surface) | #FFFFFF | Cards, modals, bottom sheets |
| Score Red (Error / Low) | #EF4444 | Low scores (<50), errors, insufficient credits |
| Score Amber (Mid) | #F59E0B | Mid scores (50–79), warnings |
| Score Green (High) | #22C55E | High scores (80+), success, credit added |

### 5.3 Typography Scale (all on Google Fonts)
| Role | Font | Weight | Size (pt) | Usage |
|---|---|---|---|---|
| Display / Hero | Syne | ExtraBold (800) | 28–36 | Screen headlines, score numbers |
| Heading | Space Grotesk | SemiBold (600) | 20–24 | Section headers, card titles |
| UI Label | Space Grotesk | Medium (500) | 14–16 | Button/tab/form labels |
| Body | DM Sans | Regular (400) | 13–15 | Instruction text, descriptions, tips |
| Caption / Hint | DM Sans | Regular (400) | 11–12 | Timestamps, metadata, tooltips |
| Monospace (data) | DM Mono | Regular (400) | 13 | Credit amounts, technical values |

Thai characters: use system font fallback (SF Pro iOS, Noto Sans Thai Android) for Thai UI copy. No custom Thai font for MVP.

### 5.4 Spacing & Grid
Base unit 8pt; all spacing is a multiple of 8 (8, 16, 24, 32, 48, 64).
- Screen horizontal padding: 20pt left/right.
- Card internal padding: 16pt.
- Section gap: 24pt between major zones.
- Button height: 56pt (full-width primary), 44pt (secondary / icon).
- Border radius: 12pt (buttons, cards), 8pt (inputs, chips), 20pt (bottom sheets), 50% (avatars, score circles).
- Minimum touch target: 44×44pt for all interactive elements (including draggable pins).

### 5.5 Iconography
iOS: SF Symbols 3+. Android: Material Symbols (Rounded). Stroke-type icons (Smash, Drop, Clear, Drive, Net Kill): custom line-art illustrations, 40×40pt in cards.

### 5.6 Motion & Animation
- Native transitions. Push: horizontal slide. Modal: slide up. Bottom sheet: spring (damping 0.8).
- Loading: skeleton screens, not spinners (except S8 custom animation).
- Score reveal: on S9 load the score circle counts up from 0 to final over 1.2s with a spring curve — the key delight moment.
- Mistake card entrance: slide in from right, staggered 80ms per card, after score animation.
- Respect system "Reduce Motion" — disable all animations.

---

## 6. UI States & Edge Cases
Every state must be explicitly designed. No bare spinners.

### 6.1 Empty States
| Screen | Trigger | Headline | Subtext | CTA |
|---|---|---|---|---|
| Home — Recent History | No analyses | "No analyses yet" | "Upload your first clip and get your AI coaching report." | "Upload My First Clip" → S4 |
| History (Tab 3) | No analyses | "Your history is empty" | "Every analysis you complete will appear here." | "Start Analyzing" → S4 |
| Transaction History | No purchases | "No transactions yet" | "Your credit purchases and analysis deductions will appear here." | "Buy Credits" → S11 |
All empty states include a relevant illustration.

### 6.2 Loading States
- Home history cards: 3 skeleton cards, shimmer fade-in.
- History list: 3 skeleton rows.
- Pro Player dropdown: spinner inside the field, disabled until loaded.
- Video thumbnail: grey placeholder with shimmer.
- AI Processing: full custom S8 screen.

### 6.3 Error States
| Error | Trigger | Message | Action |
|---|---|---|---|
| Video too dark | AI can't detect joints | Modal "Video too dark. Please re-record in better lighting." + example image | "Re-upload". Credits refunded. |
| Player not detected | No person/racket in frame | Modal "We couldn't detect a player in your video. Ensure your full body is visible." | "Re-upload" + "Get Help" (recording tips). |
| Video too blurry | Frame quality below threshold | Modal "Video is too blurry. Try recording at higher resolution or in better lighting." | "Re-upload". Credits refunded. |
| Clip too short | Trim validation bypassed | Inline under scrubber "Clip must be at least 1 second long." | Continue stays disabled. |
| Network error during upload | Upload fails mid-way | Modal "Upload failed. Check your connection and try again." | "Retry" / "Cancel". Credits NOT charged until AI confirms receipt. |
| Payment gateway error | Credit purchase fails | Modal "Payment failed. No charges were made. Please try again." | "Try Again" / "Use Different Payment Method". |
| AI processing timeout | Processing > 3 minutes | Modal "Analysis is taking longer than expected. We'll notify you when it's ready." | "Keep Waiting" / "Cancel & Refund". |

**Rule:** ALL error states after credit deduction MUST issue an automatic refund and show a toast: "+100 Credits refunded — [Error reason]."

### 6.4 Insufficient Credits State
Triggered when the user tries to confirm an analysis with balance < 100.
- S7 primary CTA changes from "Confirm & Start Analysis" to "Top Up Credits". Warning above CTA: "You need 100 Credits. Your balance: XX Credits. Shortfall: XX Credits."
- "Top Up Credits" → S11 Wallet, pre-scrolled to the package section.
- After a successful purchase in S11, Back returns to S7 with updated balance and re-enabled confirm CTA.

### 6.5 First Analysis Celebration
On the user's very first completed analysis: confetti animation over S9 for 2s; special toast "Your first analysis is complete! You're on your way." Tracked in profile, triggers once.

---

## 7. Pro Player Configuration

### 7.1 Player Data Architecture
```json
{
  "id": "PRO_001",
  "name": "Kunlavut Vitidsarn",
  "height_cm": 180,
  "nationality": "Thailand",
  "play_style": "Singles",
  "available_strokes": ["Smash", "Drop_Shot", "Clear", "Drive"],
  "reference_clips": {
    "Smash": ["clip_001_smash_a.mp4", "clip_001_smash_b.mp4"],
    "Drop_Shot": ["clip_001_drop_a.mp4"]
  },
  "matching_height_range_cm": [170, 190]
}
```

### 7.2 MVP Pro Player Roster
| ID | Player | Height (cm) | Nationality | Strokes Covered |
|---|---|---|---|---|
| PRO_001 | Kunlavut Vitidsarn | 180 | Thailand | Smash, Drop Shot, Clear |
| PRO_002 | Momota Kento | 171 | Japan | Smash, Drop Shot, Clear, Drive |
| PRO_003 | Viktor Axelsen | 194 | Denmark | Smash, Clear, Drive |
| PRO_004 | Ratchanok Intanon | 163 | Thailand | Smash, Drop Shot, Clear (Women's reference) |
| PRO_005 | Carolina Marin | 172 | Spain | Smash, Clear, Drive (Women's reference) |
At least 2 reference clips per stroke type per player are required before launch.

### 7.3 Pro Player Matching Logic
On confirm, the system picks the closest Pro Player by priority:
1. User's Favorite Pro Player (from onboarding/profile) — if they have reference clips for the selected stroke.
2. Closest height match (within ±10 cm) with reference clips for that stroke.
3. Otherwise: default to the globally highest-rated reference clips for that stroke.
The "Switch Pro Player" button on S9 manually changes the comparison player; options filtered to players with reference clips for the analyzed stroke.

---

## 8. AI Analysis Specification
Describes what the AI measures, so the feedback UI is built around real data.

### 8.1 Stroke Analysis Checkpoints (each gets a 0–100 sub-score)
| Checkpoint | Measured | Key Frame(s) |
|---|---|---|
| Grip Position | Finger placement and wrist angle for the stroke | Pre-backswing |
| Stance & Body Rotation | Hip/shoulder rotation angle vs net | Backswing initiation |
| Backswing Depth | How far the racket arm is pulled back vs optimal | Peak backswing |
| Elbow Lead | Elbow position relative to shoulder on overhead shots | Mid-swing |
| Contact Point Height | Racket–shuttlecock contact height vs reach | Moment of contact |
| Weight Transfer | Shift from back to front foot through the swing | Backswing to contact |
| Follow-Through | Whether the swing is completed or cut short | Post-contact |

### 8.2 Overall Score
Weighted average of all checkpoints. Weights vary by stroke (e.g. Contact Point Height weighted higher for Smash than Drop Shot).

| Score Range | Label | Color | Meaning |
|---|---|---|---|
| 80–100 | Excellent | Green (#22C55E) | Pro-level form. Minor refinements only. |
| 60–79 | Good | Blue (#2563EB) | Solid form. 2–3 areas to improve. |
| 40–59 | Developing | Amber (#F59E0B) | Core mechanics need work. Coachable. |
| 0–39 | Needs Work | Red (#EF4444) | Fundamental issues. Start with basics. |

### 8.3 Feedback Card Generation Rules
Max 5 Mistake Highlight Cards per analysis, sorted by severity (Critical → Major → Minor). Each card includes: a plain-language title (max 6 words); a 1–2 sentence description (mistake + performance impact); severity (Critical/Major/Minor); the timestamp of the worst frame (enables video jump); a reference to 1 drill from the drill library (shown in S10). UI must accommodate variable text length — truncate at 2 lines with "Read more", cards not fixed-height.

---

## 9. Technical Constraints

### 9.1 Video Constraints
| Constraint | Value | Design Implication |
|---|---|---|
| Formats | MP4, MOV, AVI | Show accepted formats in upload flow |
| Max file size | 500 MB | Warn if file is large |
| Min resolution | 720p (1280×720) | Warn if below threshold |
| Frame rates | 30fps and 60fps | Handled by AI |
| Camera angle | Side view, full body visible | Show camera-angle guide in S4 before trim |
| Max clip length | 15 s (after trim) | Trim scrubber enforces |
| AI processing time | 30–90 s average | S8 must handle up to 90 s |

### 9.2 Platform Constraints
| Item | Detail |
|---|---|
| iOS minimum | iOS 16+ |
| Android minimum | Android 10 (API 29)+ |
| Dark mode | Not required at MVP — design for light mode. Dark mode = Phase 2. |
| Offline mode | Not supported — internet required at all times. |
| Landscape | Portrait-locked except S9 Analysis (landscape supported). |
| Tablet | Not required at MVP — phone sizes only. |
| Localization | Thai (primary) + English (secondary). Standard i18n patterns for all copy. |

### 9.3 Accessibility Baseline
- Text contrast ≥ 4.5:1 body, 3:1 large text (WCAG AA).
- All interactive elements ≥ 44×44pt.
- All images have alt / VoiceOver labels.
- Support Dynamic Type / Font Scaling for body text — test at 1× and 1.5×.
- "Reduce Motion" disables non-essential animation.

---

## 10. User Flows

### 10.1 Happy Path — New User First Analysis
App open → S1 Splash (2s) → new user → S2 Onboarding (4 steps) → 100 Free Credits → S3 Home → tap "Upload New Clip" → S4 Trim → S5 Stroke Type → S6 Court Calibration → S7 Payment Confirmation → "Confirm & Start Analysis (100 Credits)" → S8 Processing → S9 Analysis & Comparison → review score, watch synced videos, read mistake cards → "How to Fix" → S10 Drill → "Got it, Back to Analysis" → S9 → Share → result card → Back → S3 Home.

### 10.2 Insufficient Credits Flow
"Upload New Clip" → S4–S6 → S7 with balance < 100 → "Top Up Credits" → S11 Wallet → select package + pay → balance updated → Back → S7 (balance now sufficient) → "Confirm & Start Analysis" → S8.

### 10.3 Error Recovery Flow (Bad Video)
Upload flow → S8 Processing → AI detects unanalyzable video → error modal with specific reason + illustration → credits auto-refunded (+100) + refund toast → "Re-upload" → returns to S4 Trim, or "Get Help" → Recording Tips guide (informational, no credits consumed).

---

## 11. Design Component Library

### 11.1 Buttons
| Component | Variant | State | Specs |
|---|---|---|---|
| Primary Button | Full-width | Default | Height 56pt. Blue or Orange bg. White text, Space Grotesk Medium 16pt. |
| Primary Button | Full-width | Disabled | Bg #CBD5E1, text #94A3B8, not interactive. |
| Primary Button | Full-width | Loading | Spinner replaces text, bg unchanged. |
| Secondary Button | Full-width | Default | Height 48pt. 1.5pt blue border, transparent bg, blue text. |
| Text Button | Inline | Default | No bg, blue or slate text, 14–15pt. |
| Destructive Button | Full-width | Default | Error Red bg, white text. Delete actions only. |
| Chip / Tag | Small | Default | Height 28pt, 12pt h-padding, 14pt radius, Light bg, slate 12pt text. |
| Chip / Tag | Small | Active | Blue bg, white text. |

### 11.2 Input Fields
- Text Input: 48pt, 1pt #CBD5E1 border, 8pt radius, focus = 2pt blue. Label above (12pt slate). Input 15pt black. Placeholder 15pt #94A3B8.
- Number Stepper: minus | value | plus. Buttons 40pt diameter, blue border. Value 18pt bold centered.
- Dropdown / Select: like Text Input + chevron right. Opens as action sheet (iOS) / bottom sheet (Android).
- Segmented Control: full-width, 40pt, 8pt radius. Active = white bg + shadow; inactive transparent.
- Slider: 24pt blue thumb, 4pt track, blue left of thumb, light-grey right.
- Search Field: 40pt, #F1F5F9 bg, 10pt radius, search icon left, clear button right.

### 11.3 Cards
- Analysis Summary Card (Home): 160×120pt, 10pt radius, shadow 0 2pt 8pt rgba(0,0,0,0.08).
- Analysis History Card (Tab 3): full-width, 80pt, horizontal, same shadow.
- Package Card (Wallet): full/half-width variants, 12pt radius.
- Mistake Highlight Card: full-width, variable height, 12pt radius, 4pt left accent (blue Critical / amber Major / grey Minor).
- Coaching Tip Card (Home): full-width, 80pt, #EFF6FF bg, 1pt #BFDBFE border, 12pt radius.

### 11.4 Overlays & Sheets
- Bottom Sheet: slides up. Handle bar 36×4pt #CBD5E1 centered. 20pt top radius, white bg. Dim overlay rgba(0,0,0,0.4).
- Modal Dialog: center-anchored, max width 320pt, 24pt padding, 16pt radius, white. Title 18pt bold, body 14pt.
- Toast: bottom, 16pt above tab bar, pill (24pt radius), #0F172A bg, white 13pt text, max 80% width, auto-dismiss 3s, tap to dismiss.
- Confirmation Modal: like Modal Dialog. Destructive action = red, non-destructive = blue, cancel = slate text.

### 11.5 Sponsor Badge Component ("SponsorBadge")
Variants: Dark (white text on orange) / Light (orange text on white). Content "Presented by BANTHONGYORD", all caps, letter-spacing 0.08em. Font Space Grotesk Medium 11pt. Padding 6pt vertical / 12pt horizontal. Radius 4pt. Never overlaps functional content.

---

## 12. Sponsor Integration Checklist
- Splash (S1): "Presented by Banthongyord" visible, correctly styled.
- Home (S3): sponsor strip below header, correctly sized.
- Analysis Result (S9): sponsor attribution in share card.
- Profile (S14): "About" section includes sponsor credit line.
- Sponsor badge never overlaps functional content on any screen.

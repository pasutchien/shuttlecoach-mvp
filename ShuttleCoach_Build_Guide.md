# Shuttle Coach — Build & Launch Guide

How to turn the MVP spec into a real, shareable app — written for someone who knows "GitHub → Vercel" but hasn't shipped a mobile app before.

You have **3 files** from this session:

1. **`ShuttleCoach_Build_Guide.md`** — this file. Read it once, top to bottom.
2. **`SPEC.md`** — your MVP spec, cleaned up. This goes *inside* the project so Claude Code can read it.
3. **`ShuttleCoach_ClaudeCode_Prompt.md`** — the prompt you paste into Claude Code to build the app.

---

## 1. The decision: how do you ship a "native app" as a shareable link?

Your spec describes a **native iOS/Android app**. Your goal is **a link your promoter can open and play with today** — and the option to ship a real app store app later. Those two goals sound opposed. One stack solves both.

### The recommended stack — Expo (React Native)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo** (React Native, SDK 53+) | One codebase → **Web + iOS + Android**. The web build gives you the link now; the same code becomes the real app later. |
| Language | **TypeScript** | Industry standard. Lets your full-stack friend integrate the backend safely with typed contracts. |
| Routing | **Expo Router** | File-based navigation (like Next.js). Clean, professional, easy to extend. |
| Styling | **NativeWind v4** | Tailwind CSS, but for React Native. The modern, professional styling workflow. |
| Components | **react-native-reusables** | This is **shadcn/ui rebuilt for React Native** — the exact component library you asked for, working on web *and* native. |
| Icons | **lucide-react-native** | The Lucide icon set you asked for, the React Native build of it. |
| Hosting (now) | **Vercel** | The web build deploys to Vercel exactly like any site — your existing GitHub → Vercel workflow works unchanged. |
| Builds (later) | **EAS Build** | Expo's cloud service compiles real `.ipa` / `.apk` files for TestFlight and the Play Store. |

### Important note about shadcn/ui

You asked for **shadcn/ui** and **Lucide**. One clarification: plain shadcn/ui is a **web-only** library — it cannot run inside a real native app. If you used it directly you'd be locked into a website forever, and rebuilding for the app store would mean starting over.

**react-native-reusables** is the answer: it is shadcn/ui's components, deliberately re-implemented for React Native with NativeWind. Same look, same copy-paste philosophy, same Lucide icons — but it runs on web, iOS, and Android from one codebase. You lose nothing and you keep the path to a real app. This is the genuinely professional choice for what you're building.

### Why not just a plain website (Next.js + shadcn)?

A Next.js website would be the fastest possible link — but it is a dead end for "later build a real app." A browser tab cannot access the camera roll, native video trimming, or app-store distribution the way the spec needs. You would throw it away and rebuild. Expo avoids that waste.

---

## 2. What you will end up with

After running the Claude Code prompt you'll have a project that:

- Runs **all 14 screens** (S1–S14) as a fully clickable prototype.
- Works **without any backend** — it ships with realistic mock data (fake analyses, the 5 Pro Players, sample mistake cards, fake processing delays), so your promoter can click through the entire happy path.
- Has a **clean service layer** so your friend swaps mock data for the real CV/AI backend by changing one file — no UI rewrite.
- Deploys to **Vercel as a web link** for instant sharing.
- Compiles to a **real iOS/Android app** later with zero architecture changes.

---

## 3. Step-by-step: what you actually do

### Step 0 — Install the tools (once)
- **Node.js** — install the LTS version from nodejs.org.
- **Git** — git-scm.com.
- **Claude Code** — follow Anthropic's install instructions.
- A **GitHub** account and a **Vercel** account (you already have these).

### Step 1 — Create the project folder
Make an empty folder, e.g. `shuttle-coach`. Copy **`SPEC.md`** into it. Open the folder in your terminal and start Claude Code there.

### Step 2 — Run the prompt
Open **`ShuttleCoach_ClaudeCode_Prompt.md`**, copy the whole prompt, and paste it into Claude Code. It will scaffold the Expo project, install everything, and build all 14 screens. This takes a while — let it work, and answer any questions it asks.

### Step 3 — Test locally
When it's done, run:
```
npx expo start
```
Press **`w`** to open the app in your web browser (this is what your promoter will see). Or scan the QR code with the **Expo Go** app on your phone to test it natively. Click through the happy path and confirm everything works.

### Step 4 — Push to GitHub
Create a new empty repo on GitHub, then in the project folder:
```
git init
git add .
git commit -m "Shuttle Coach MVP"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 5 — Deploy to Vercel
- In Vercel, click **Add New → Project** and import your GitHub repo.
- Set the **Build Command** to `npx expo export --platform web`.
- Set the **Output Directory** to `dist`.
- Click **Deploy**. (The Claude Code prompt also creates a `vercel.json` so this is mostly automatic.)

### Step 6 — Share the link
Vercel gives you a URL like `shuttle-coach.vercel.app`. Send that to your promoter. They open it on their phone's browser — no install, no app store. Every push to GitHub auto-redeploys.

### Step 7 — Later: the real app
When you're ready for the app store, install EAS (`npm install -g eas-cli`), run `eas build`, and Expo compiles real iOS/Android binaries for TestFlight and Google Play. Same codebase — nothing to rewrite.

---

## 4. How your full-stack friend plugs in the backend

This is built into the prompt deliberately, so the hand-off is clean.

- **All backend calls live in one place.** The app talks to a single service module (`src/services/api.ts`) that defines a typed contract — `submitAnalysis`, `getAnalysisStatus`, `getAnalysisResult`, `listProPlayers`, `purchaseCredits`, and so on.
- **The demo runs on mock implementations** of that contract (`src/services/mock/`). A single environment flag, `EXPO_PUBLIC_USE_MOCK_API`, switches between mock and real.
- **Your friend's job** is to implement the real version against the CV/AI backend (the same pipeline behind the existing ShuttleIQ Streamlit app: video + stroke type + 4 court corners → pose analysis → pro match → scored result). They write the real HTTP calls, flip the flag, and the entire UI keeps working untouched.
- **A `BACKEND.md` file** is generated documenting every endpoint, request shape, and response shape — so your friend has an exact API specification, not guesswork.

The court calibration in your spec (S6 — drag 4 pins) maps directly onto the corner-marking step the CV backend already requires, so the data the frontend collects is exactly what the backend expects.

---

## 5. A few honest cautions

- **The demo is a front-end prototype.** Until your friend wires the backend, "analysis results" are realistic fake data. That is correct and intended — it lets the promoter feel the full product now.
- **Video features are simulated on web.** Real device video trimming and camera-roll access only fully work in the native build (Expo Go / EAS). On the Vercel web link, the upload/trim screens use a bundled sample clip so the flow is still demonstrable.
- **Pro Player reference clips** are placeholders. Real comparison footage gets added with the backend.
- Keep the **`SPEC.md`** file in the repo — it stays the source of truth as the app evolves.

---

*Next file to open: `ShuttleCoach_ClaudeCode_Prompt.md` — copy its contents into Claude Code.*

# Agent Team — Review & Improve Prompt (Shuttle Coach)

Use this **after** your first build prompt has finished and the app runs. It sets up a team of specialist AI agents that audit the app, research current trends, and improve it.

---

## Do I need to turn on a "Claude agent team" feature?

**No.** Subagents are built into Claude Code and **enabled by default** — there is no toggle, setting, or feature flag to turn on. The prompt below simply tells Claude Code to create a team of specialist agents and put them to work.

Two things worth knowing:
- Type **`/agents`** in Claude Code at any time to open a UI where you can see, edit, or add agents. Optional — the prompt below creates them for you automatically.
- There is one advanced, experimental option called "forked subagents" (an environment variable). **You do not need it.** Ignore it.

The agents are stored as small Markdown files in a `.claude/agents/` folder inside your project. Claude Code will create that folder itself when it runs the prompt.

## When and where to run this

In the **same project folder** (`C:\claude-proj\shuttlecoach\mvp`), after the app is built and you've confirmed it runs with `npx expo start`. Start Claude Code and paste the prompt below.

## What the team does

- **trend-researcher** — can browse the internet; researches current 2026 mobile-app and sports-analysis UX trends.
- **ux-reviewer** — checks the app's UX against `SPEC.md` and modern best practice.
- **code-reviewer** — checks architecture, TypeScript quality, and refactor opportunities.
- **a11y-perf-auditor** — checks accessibility (WCAG, touch targets, Reduce Motion) and performance.

The reviewers are **read-only** (they audit, they don't edit). The main Claude Code agent collects everything, writes a prioritized `IMPROVEMENTS.md`, implements the safe high-value fixes itself, and lists bigger changes for **you to approve** before touching them.

---

## THE PROMPT — copy everything below the line into Claude Code

---

You are the lead engineer on the Shuttle Coach app (a React Native / Expo badminton form-analysis app). The app has already been built in this folder. I want a thorough review-and-improve pass using a team of specialist subagents. Work autonomously through all phases.

### Phase 1 — Create the agent team

Create these four subagent definition files in `.claude/agents/`. Each is a Markdown file with YAML frontmatter. All four reviewers are **read-only** — they must not edit files.

**`.claude/agents/trend-researcher.md`**
- name: trend-researcher
- description: Researches current mobile-app and sports-analysis UX/design trends on the web.
- tools: WebSearch, WebFetch, Read, Grep, Glob
- prompt: You research current (2026) trends for mobile apps, especially AI sports-analysis and coaching apps (tennis, golf, fitness). Search the web for what modern, well-rated apps do well — onboarding, video review UX, feedback presentation, monetization, retention, visual design. Compare findings against this app. Report concrete, specific, actionable ideas the app is missing or could improve. Cite sources. Do not edit files.

**`.claude/agents/ux-reviewer.md`**
- name: ux-reviewer
- description: Reviews app UX and UI against the spec and best practice.
- tools: Read, Grep, Glob
- prompt: You are a senior product designer. Review every screen of this app against `SPEC.md` (the source of truth) and modern mobile UX best practice. Check flows, copy, empty/loading/error states, thumb-first layout, visual hierarchy, consistency, and delight. List specific gaps and improvements with the file and screen they apply to. Do not edit files.

**`.claude/agents/code-reviewer.md`**
- name: code-reviewer
- description: Reviews architecture, TypeScript quality, and refactor opportunities.
- tools: Read, Grep, Glob
- prompt: You are a senior React Native engineer. Review the codebase for architecture quality, TypeScript strictness, component reuse, dead code, the cleanliness of the service/mock API layer, state management, and maintainability for a second developer integrating a backend. List specific issues with file paths and concrete refactor recommendations. Do not edit files.

**`.claude/agents/a11y-perf-auditor.md`**
- name: a11y-perf-auditor
- description: Audits accessibility and performance.
- tools: Read, Grep, Glob
- prompt: You audit accessibility and performance. Check WCAG AA contrast, 44x44pt touch targets, VoiceOver/TalkBack labels, Dynamic Type / font scaling, and Reduce Motion support. Check for performance issues: unnecessary re-renders, heavy lists without virtualization, large assets, unoptimized images. List specific issues with file paths. Do not edit files.

### Phase 2 — Run the audit in parallel

First read `SPEC.md` and skim the codebase yourself. Then launch all four subagents **in parallel** in a single step. Give each one the full context: this is the Shuttle Coach MVP, `SPEC.md` is the source of truth, the app must stay on mock data, and a second developer will integrate the real backend later.

### Phase 3 — Synthesize

Collect all four reports. Write **`IMPROVEMENTS.md`** in the project root: a single prioritized list. For each item include — title, which agent raised it, why it matters, priority (High / Medium / Low), estimated effort, and risk (Safe / Needs care / Risky). De-duplicate overlapping findings. Put the highest-value, lowest-risk items at the top.

### Phase 4 — Implement

- Implement **all High-priority, Safe items** directly.
- Implement Medium-priority Safe items if they are quick and clearly beneficial.
- Do **not** implement anything marked "Risky" or any large architectural change — instead list those clearly under a "Needs your approval" section in `IMPROVEMENTS.md` and stop before touching them.
- Never break the mock-data setup or the `SPEC.md`-defined behavior. Never add real network calls.

### Phase 5 — Verify

After implementing, confirm the app still works: TypeScript compiles in strict mode with no errors, and `npx expo start --web` runs cleanly. Fix anything you broke. Then give me a short summary: what the team found, what you changed, and what is waiting for my approval.

Work through all phases autonomously. Ask me only if a decision genuinely needs my input.

---

*After this runs: open `IMPROVEMENTS.md`, read the "Needs your approval" section, and tell Claude Code which of those bigger items to proceed with.*

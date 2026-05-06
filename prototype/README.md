# EduClaw Prototype

Phase 1 UI/UX prototype for the EduClaw AI Agent Design Framework. **Mock data only — no backend, no real LLM, no real auth.**

Plan: [`../docs/phase1-foundation.md`](../docs/phase1-foundation.md).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — root redirects to `/demo` (the screen index).

## What's in this scaffold

This is the Week 1 baseline. It includes:

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui primitives + Lucide icons
- `MockDataProvider` (`lib/mock/`) with shapes annotated by the eventual MCP source
- `RoleProvider` + `useRoleFlags()` for persona switching (persisted to localStorage)
- Top-nav role switcher that routes you to each persona's dashboard
- Custom EduClaw component shells:
  - `<DiagnosticBanner>` (Inference)
  - `<ClarifyingQuestionCard>` (Dialogue)
  - `<ScaffoldedResponse>` + `<CitationChip>` (Execution)
  - `<ValidationVerdictRibbon>` (Validation)
  - `<ReflectionPrompt>` (Reflection)
  - `<AgentHopDiagram>` (Orchestrator trace)
  - `<ConsentToggle>` (Privacy Center)
  - `<MasteryDot>` + `<ConfidencePip>`
  - `<PolicyClauseEditor>` (Faculty Validation Policy authoring)
- `/demo` index that lists every Phase 1 screen with status (Ready / Stub / Planned) and target week
- `/login` mock SSO chooser
- One implemented page per persona to verify the routing tree:
  - `/student/dashboard` — companion home with mastery snapshot
  - `/faculty/dashboard` — stub
  - `/advisor/dashboard` — stub
  - `/admin/dashboard` — stub
  - `/auditor/dashboard` — trace explorer using `<AgentHopDiagram>` against the hero conversation fixture
- One implemented surface per non-web channel:
  - `/lms-embed/canvas` — Canvas frame mock with embedded companion panel
  - `/mobile-preview/home` — iPhone-frame mobile companion home
  - `/chat-preview/slack-student` — Slack student `/educlaw ask` flow

## What's still planned

See `lib/mock/screens.ts` for the full inventory (75 screens). The `/demo` page renders this manifest with progress.

## Hard rules (don't break these)

1. **No network calls.** No `fetch`, no API routes, no env-var-required services. Everything reads from `lib/mock/`.
2. **No real auth.** The role switcher in the top nav swaps personas instantly — there is no login.
3. **Every mock data shape must carry a `// TODO MCP: <tool-name>` comment.** When Phase 2 swaps in real MCP servers, only the data source changes.
4. **No fake Radix packages.** `@radix-ui/react-badge` and `@radix-ui/react-sheet` do not exist; Badge is custom; Sheet uses Dialog primitive.
5. **`postcss.config.js` and `tailwind.config.js` must stay as `.js` files.** TypeScript versions break Tailwind silently.

## Sprint plan

See [`../docs/phase1-foundation.md`](../docs/phase1-foundation.md) §8 for the 12-week plan and stakeholder checkpoints.

## Open decisions before Week 3

§11 of the plan — brand palette, pilot LMS (default Canvas), pilot courses, faculty design partner cohort, Privacy Center scope, Validation verdict tone, mobile fidelity, localization.

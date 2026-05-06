# EduClaw Phase 1 Foundation — UI/UX Prototype Sprint

**Version:** 0.1 (draft)
**Owner:** Praveen
**Window:** 12 weeks (3 months)
**Status:** Draft for review

---

## 1. Pivot from the Original Plan

The build plan's original Phase 1 was infra/identity/data/eval-harness/MCP scaffolding. We are deferring all of that to a renamed **Phase 2 (Platform Foundation)** and using Phase 1 to **design and build a clickable UI/UX prototype of the entire EduClaw concept**, end-to-end, with mock data only and no backend.

**Why this ordering**
- Stakeholder and faculty sign-off is far cheaper to get on screens than on running systems.
- The TwinAgent's value is in the *interaction design* (how Inference, Dialogue, Validation, Reflection feel to a student). Designing this in a prototype forces the pedagogy decisions early.
- A finished prototype becomes the source of truth for every backend contract built in Phase 2 (mock data shapes → API shapes → MCP tool inputs).
- Same pattern that worked for BeyondSeed: lock the UI in 4–12 weeks, then build the backend against frozen contracts.

**What we are NOT doing in Phase 1**
- No Claude API calls, no Agent SDK wiring, no real LLM responses.
- No AWS/Terraform/Kubernetes/VPC.
- No real Okta/Azure AD/Shibboleth — mock auth only.
- No real LMS/SIS/Library connections — mock data with the same shapes the MCP servers will eventually return.
- No databases beyond an in-memory mock store.
- No evals, no Langfuse, no observability.

---

## 2. Goals & Exit Criteria

### Goals
1. A clickable Next.js prototype covering all four surfaces (Web, LMS embed, Mobile preview, Chat preview) for all five roles (Student, Faculty, Advisor, Admin, Auditor).
2. Every one of the six agent patterns visible in at least one hero flow with realistic mock outputs.
3. A reusable design system (tokens, components, patterns) that the backend phase will inherit unchanged.
4. A `MockDataProvider` whose data shapes mirror what the eventual MCP servers will return — so backend work in Phase 2 is largely "swap mock for real."
5. Faculty and student stakeholder sign-off on the screens that matter most: the Guided Learning Cycle, the Validation Policy authoring flow, and the Privacy Center.

### Exit Criteria
- [ ] Every screen in §6 is reachable from the demo index and renders without error.
- [ ] Hero flow ("Student gets stuck on a calculus assignment") demonstrates Notice → Diagnose → Ask → Act → Check → Reflect with all six agents represented in UI.
- [ ] Faculty can author a Validation Policy and see it enforced in a simulated student turn.
- [ ] Privacy Center shows a working consent ledger toggling what data the agent can see.
- [ ] WCAG 2.2 AA pass on the hero flow (audited with axe + manual keyboard run).
- [ ] Mock data layer documented; every shape annotated with the future MCP tool that will produce it.
- [ ] Stakeholder review completed; sign-off recorded in `docs/phase1-signoff.md`.
- [ ] Design tokens and component library exported as a package the Phase 2 backend phase can consume without modification.

---

## 3. Approach (Stack & Conventions)

Mirrors the BeyondSeed playbook:

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| UI library | shadcn/ui + Radix primitives |
| Styling | Tailwind CSS |
| Icons | Lucide |
| Mock data | `MockDataProvider` React context — no `fetch`, no API calls |
| Role gating | `useRoleFlags()` — Student / Faculty / Advisor / Admin / Auditor |
| Charts | Recharts (mastery maps, KPI dashboards) |
| Mobile preview | Responsive Next.js routes inside an iPhone frame; full React Native deferred to Phase 2 |
| Chat preview | Static Slack/Teams "screenshot" frames built in React |
| LMS embed preview | Iframe-style Canvas/Blackboard mock chrome around the agent panel |
| Forms | react-hook-form + zod |
| State | React context only — no Redux, no React Query |
| Routing roles | Next.js route groups: `(student)`, `(faculty)`, `(advisor)`, `(admin)`, `(auditor)` |
| Code quality | ESLint, Prettier, TypeScript strict |
| Demo entry | `/demo` index page lists every screen for stakeholder walkthroughs |

**Hard rules**
- No network calls of any kind.
- No real auth — a role-switcher in the dev nav swaps personas instantly.
- Every screen must work with `MockDataProvider` defaults (no required env vars).
- Every mock data shape must have a `// TODO MCP: <tool-name>` comment indicating which Phase 2 MCP tool will replace it.

---

## 4. Personas

| Persona | Primary jobs | Surfaces |
|---|---|---|
| **Student** | Get unstuck on coursework without being given the answer; reflect; track mastery; control privacy. | Web, LMS embed, Mobile, Chat |
| **Faculty** | Author Validation Policies per assignment; review flagged turns; see class-level mastery; ingest course materials. | Web, LMS embed, Chat |
| **Advisor** | Triage at-risk students; run advising conversations; schedule interventions. | Web, Chat |
| **Admin / Ops** | Manage tenants, integrations, KPIs, audit, user roles, policy bundles. | Web |
| **Auditor** | Read-only access to traces, decisions, FERPA scope expansions. | Web |

Each persona gets a one-page profile in `docs/personas/` with jobs-to-be-done, a representative day-in-the-life, and the pedagogy claims being tested.

---

## 5. The Guided Learning Cycle as UI

This is the hero pattern; everything else hangs off it. The student-facing conversation surface must visibly express the cycle and the agents underneath it. Suggested UI treatment:

| Stage | Driving agent | UI affordance |
|---|---|---|
| Notice | Inference | Subtle banner: "Looks like you might be stuck on the chain rule — want to talk through it?" with confidence pip. |
| Diagnose | Inference | Expandable diagnostic card showing intent, gap, urgency (faculty/advisor see this; student sees a softened version). |
| Ask | Dialogue | Clarifying question card with chips ("Yes, that's it" / "Not quite — it's actually...") |
| Act | Execution | Scaffolded response with citations to course materials, action buttons (open assignment, schedule study session). |
| Check | Validation | Verdict ribbon: Approved (green, silent), Modified (amber, with pedagogical reason), Blocked (red, with student-friendly explanation). |
| Reflect | Reflection | Optional prompt card at end of turn: "Explain back what you just learned in one sentence." |

The Orchestrator is invisible to students but is shown in faculty/auditor trace views as a hop diagram (Inference → Dialogue → Execution → Validation → Reflection).

---

## 6. Screen Inventory

Targeting ~75 screens. Stub-then-fill order follows §8.

### 6.1 Auth & onboarding (5)
- Login (SSO chooser: Okta / Azure AD / Shibboleth — all mock)
- SSO callback / role detection
- First-run consent setup (Privacy Center walkthrough)
- Role switcher (dev-only, in nav)
- Logout confirmation

### 6.2 Student web portal (16)
- Companion home (today's nudges, active conversations, in-progress courses)
- Course list
- Course detail with embedded companion panel
- **Conversation surface (hero)** — the full Guided Learning Cycle
- Conversation history list
- Single past conversation viewer
- Study plan
- Practice problems runner
- Reflection journal (list + entry view)
- Portfolio (artifacts + reflections)
- Mastery map (per course, per outcome)
- Calendar / schedule
- Notifications
- Privacy Center (consent ledger)
- Settings (preferences, accessibility, language)
- Help / Trust & Safety brief

### 6.3 Faculty web portal (12)
- Faculty co-pilot dashboard
- Course list (taught)
- Course setup (objectives, materials, policies)
- **Validation Policy authoring** (per-assignment, hero flow for faculty)
- Validation review queue (flagged turns)
- Single flagged turn — review console with full agent trace
- Class mastery map
- Student roster with consent-gated detail
- Course materials ingestion / review queue
- Discipline guardrails editor
- Co-design notes (faculty design partner cohort)
- Activity simulator ("preview what a student would see under this policy")

### 6.4 Advisor web portal (8)
- Advisor dashboard (caseload, risk indicators)
- Student case list (with filters)
- Student profile (consent-gated)
- Advising conversation thread
- Schedule / appointments
- Intervention plans
- Notes / journal
- Outcomes dashboard (cohort-level)

### 6.5 Admin & Auditor web portal (12)
- Tenant overview (admin)
- Integration status: LMS, SIS, SSO, library, advising (admin)
- KPI dashboard (admin) — six headline metrics from §12 of the build plan
- Eval results dashboard (admin) — pedagogy and safety metrics
- User & role management (admin)
- Policy bundle management (admin)
- Audit logs (admin + auditor)
- Trace explorer (auditor) — Langfuse-style hop diagram per turn
- Single trace deep-dive (auditor)
- FERPA scope-expansion log (auditor)
- Cost dashboard per agent (admin)
- Red-team queue (admin)

### 6.6 LMS-embedded surface (6)
- Canvas-frame mock with EduClaw side panel — assignment-aware companion
- Blackboard-frame mock with side panel
- Moodle-frame mock with side panel
- D2L-frame mock with side panel
- Faculty deep-link configuration modal (LTI 1.3 Deep Linking)
- LMS-side opt-in toggle for an assignment

### 6.7 Mobile preview (8) — responsive Next.js inside iPhone frame
- Mobile companion home
- Mobile conversation
- Mobile voice reflection (mic UI mock)
- Mobile calendar nudge
- Mobile offline study pack
- Mobile push notification center
- Mobile Privacy Center
- Mobile settings / accessibility

### 6.8 Chat preview (6) — static Slack/Teams frames in React
- Slack: student `/educlaw ask` flow
- Slack: faculty co-pilot in a course channel
- Slack: advising bot DM
- Teams: student in-thread reply
- Teams: ops agents (IT help, financial aid, registrar) catalog
- Privacy notice mock

### 6.9 Cross-cutting (6)
- `/demo` screen index (every screen, every role)
- Empty states gallery
- Loading states gallery
- Error states gallery
- Accessibility test page (axe-rendered)
- Component library showcase (Storybook-style page)

---

## 7. Design System Foundations

Built in Week 1, frozen by end of Week 2.

### Tokens
- **Color** — placeholder pending brand: deep navy `#0E2A47` (primary), teal `#0D9488` (accent), warm amber `#D97706` (Validation/modified), red `#B91C1C` (blocked), neutral grays. Confirm with stakeholder before Week 3.
- **Type** — Inter for UI, Source Serif Pro for long-form reading content (course materials).
- **Spacing** — 4px base scale.
- **Radius** — 8px default, 12px for cards, 9999px for pills.
- **Motion** — 200ms standard, reduced-motion respected.
- **Density** — comfortable default; compact mode for advisor caseload tables.

### Custom EduClaw components (beyond shadcn baseline)
- `<DiagnosticBanner>` — Inference output, with confidence pip and "why am I seeing this?" link.
- `<ClarifyingQuestionCard>` — Dialogue prompt with chip answers.
- `<ScaffoldedResponse>` — Execution output with worked examples and inline citations.
- `<CitationChip>` — links back to the source course material chunk.
- `<ValidationVerdictRibbon>` — Approved / Modified / Blocked with pedagogical reason.
- `<ReflectionPrompt>` — optional, dismissible, never gates progress.
- `<ConsentToggle>` — single-row toggle in Privacy Center with current scope.
- `<AgentHopDiagram>` — auditor-facing Orchestrator trace.
- `<MasteryDot>` — outcome-level mastery indicator (empty → full).
- `<ConfidencePip>` — small calibrated-uncertainty visual.
- `<PolicyClauseEditor>` — faculty-facing block for "show me, don't solve for me" rules.

### Accessibility (WCAG 2.2 AA, day one)
- Color contrast ≥ 4.5:1 body, ≥ 3:1 large text.
- Full keyboard nav with visible focus rings.
- Screen-reader labels on every interactive element.
- Reduced-motion + high-contrast modes.
- Reading-level adaptation hooks in mock content (so we can test grade-level shifts).
- All hero-flow screens audited with axe before sign-off.

---

## 8. Sprint Plan (12 weeks)

| Week | Focus | Deliverables |
|---|---|---|
| 1 | Foundations | Personas finalized, journey maps drawn, IA confirmed, repo scaffolded with Next.js + shadcn + Tailwind, role-switcher and `MockDataProvider` working, design tokens v1. |
| 2 | Design system | Component library (shadcn baseline + every custom EduClaw component from §7), Storybook-style showcase page, axe pass on showcase. |
| 3 | Hero flow part 1 | Student conversation surface with Inference + Dialogue + Execution agents wired end-to-end against mock data. |
| 4 | Hero flow part 2 | Add Validation + Reflection to the same conversation; orchestrator hop diagram for trace view; demo to internal team for first feedback. |
| 5 | Student portal breadth | Companion home, course list, course detail, study plan, practice runner, reflection journal, portfolio. |
| 6 | Student portal close-out | Mastery map, calendar, notifications, **Privacy Center (hero for trust)**, settings, help. |
| 7 | Faculty surface part 1 | Faculty dashboard, course list, course setup, **Validation Policy authoring (hero)**, activity simulator. |
| 8 | Faculty surface part 2 | Validation review queue, single-turn review console with trace, class mastery map, materials ingestion review, discipline guardrails. |
| 9 | Advisor + Admin + Auditor | Advisor caseload + thread, admin tenant/integrations/KPI/eval/audit/cost/red-team, auditor trace explorer + FERPA scope log. |
| 10 | LMS embed | Canvas/Blackboard/Moodle/D2L frame mocks with embedded companion panel; faculty deep-link config; assignment opt-in. |
| 11 | Mobile + Chat | iPhone-frame mobile screens (8), Slack/Teams static frames (6). |
| 12 | Polish + sign-off | Empty/loading/error galleries, accessibility audit on every hero flow, `/demo` index polish, walkthrough deck, stakeholder review, sign-off doc. |

**Stakeholder checkpoints**
- End Week 2: tokens + component library walkthrough.
- End Week 4: hero flow demo (most important checkpoint — confirms the pedagogy reads correctly on screen).
- End Week 7: Validation Policy authoring flow with 1–2 faculty design partners.
- End Week 9: full role coverage demo (student, faculty, advisor, admin, auditor).
- End Week 12: final sign-off.

---

## 9. Mock Data Strategy

Every mock shape exists in `lib/mock/` and is annotated with the eventual MCP source. Example:

```ts
// lib/mock/learnerState.ts
// TODO MCP: learner_state.read(learner_id) — see §5.1 of build plan
export type LearnerState = {
  learner_id: string;
  goals: { explicit: string[]; inferred: string[] };
  mastery: Array<{ outcome_id: string; estimate: number; evidence: string[] }>;
  consent_ledger: Array<{ scope: string; granted: boolean; updated_at: string }>;
  // ...
};
```

Mock fixtures live in `lib/mock/fixtures/` and are organized by persona scenario (e.g. `student-stuck-on-chain-rule.ts`, `faculty-reviewing-flagged-turn.ts`, `advisor-triaging-at-risk.ts`).

Each fixture is the exact shape the future MCP tool will return. When Phase 2 swaps in real tools, only the data source changes — components untouched.

---

## 10. Repo Layout (proposed)

```
EduClaw/
  docs/
    phase1-foundation.md          (this file)
    personas/
    decisions/                    (architecture decision records)
    phase1-signoff.md             (created at end of Phase 1)
  prototype/                      (the Next.js app)
    app/
      (auth)/
      (student)/
      (faculty)/
      (advisor)/
      (admin)/
      (auditor)/
      lms-embed/
        canvas/
        blackboard/
        moodle/
        d2l/
      mobile-preview/
      chat-preview/
      demo/                       (screen index)
    components/
      ui/                         (shadcn primitives)
      educlaw/                    (custom components from §7)
      layout/
      conversation/
      faculty/
      advisor/
      admin/
    lib/
      mock/
        fixtures/
      hooks/
      utils/
    styles/
    public/
  packages/                       (optional — extract design system later)
```

---

## 11. Open Decisions (need stakeholder input before Week 3)

1. **Brand palette** — placeholder colors in §7 need confirmation or replacement.
2. **Pilot LMS** — build plan recommends Canvas; confirm so the LMS embed mock is faithful.
3. **Pilot courses** — pick 1–3 disciplines so mock data scenarios feel real (e.g., calculus + composition + nursing).
4. **Faculty design partner cohort** — recruit 2–3 faculty for Week 4 and Week 7 reviews.
5. **Privacy Center scope** — confirm what consent toggles must be visible to the student in Phase 1 (likely: course-context sharing, prior-conversation sharing, advisor visibility, third-party tool access).
6. **Validation verdict tone** — confirm voice/wording for "Modified" and "Blocked" student-facing messages with faculty + student affairs before Week 4.
7. **Mobile fidelity** — responsive web inside iPhone frame for Phase 1, or build a thin Expo prototype? Default: web inside frame. Confirm.
8. **Localization** — which languages for Phase 1 mock content? Default: English only, with i18n plumbing in place.

---

## 12. Phase 2 Preview (so Phase 1 work compounds)

When Phase 1 sign-off lands, Phase 2 begins with the original build-plan foundation work — but informed by frozen UI contracts:
- AWS VPC, Kubernetes, Postgres + pgvector, KMS.
- Real Okta/Azure AD/Shibboleth SSO replacing mock auth.
- Claude Agent SDK + MCP servers (LMS, SIS, library, advising, integrity, scheduler, notification).
- Eval harness with gold sets seeded from the Validation Policies authored in Phase 1.
- Langfuse + OTel observability.
- FERPA review and SOC 2 readiness work.

The Phase 1 prototype becomes the demo-able, stakeholder-aligned target Phase 2 builds toward.

---

## 13. Risks Specific to a UI-First Phase 1

| Risk | Mitigation |
|---|---|
| Prototype looks "done" and stakeholders pressure for production launch. | Big visible "PROTOTYPE — mock data only" banner on every screen; sign-off doc explicitly states Phase 2 is required. |
| Mock data shapes drift from what MCP tools can actually return. | `// TODO MCP:` annotations + a Phase 2 reconciliation pass before any backend work begins. |
| Pedagogy claims in mock outputs are not real. | Faculty design partners review hero-flow content in Week 4; their wording replaces lorem-ipsum. |
| Accessibility deferred to "later" and rots. | Axe pass each sprint; WCAG 2.2 AA a hard exit gate, not a polish item. |
| Scope creep — every stakeholder wants their pet screen. | Screen inventory in §6 is the contract; new screens require a sign-off conversation, not a sprint slip. |

---

## Appendix A — Hero Flow Script (Week 3–4)

**Scenario:** A student is working on a calculus assignment in their LMS and gets stuck on the chain rule.

1. Student opens the assignment in Canvas; EduClaw side panel detects the stuck signal (mock).
2. **Inference Agent** posts a `<DiagnosticBanner>`: "Looks like you're working through the chain rule — want to think it through together?" Confidence pip shows medium-high.
3. Student clicks yes. **Dialogue Agent** posts a `<ClarifyingQuestionCard>`: "Before we start — is the part that's tricky the *order* of operations, or *which function is inside which*?"
4. Student picks "which function is inside which". **Execution Agent** posts a `<ScaffoldedResponse>` with two worked analogs (citations to the course textbook chunks via `<CitationChip>`) and a "try this next" practice item — *not* the answer to the homework problem.
5. **Validation Agent** has approved this turn silently (green ribbon visible on hover only). If the student had asked "just give me the answer to problem 3", the verdict would have been Modified, with a `<ValidationVerdictRibbon>` showing the pedagogical reason and an alternate scaffold.
6. Student completes the practice item. **Reflection Agent** posts a `<ReflectionPrompt>`: "In one sentence, how would you explain the chain rule to a classmate?" Optional, dismissible.
7. Auditor view (separate role) shows the full `<AgentHopDiagram>`: Inference → Dialogue → Execution → Validation → Reflection, with timing and confidence per hop.

This script becomes the Week 4 demo and the canonical example faculty design partners react to.

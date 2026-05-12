# EduClaw Backend Planning Document

## 1) Project Summary (Simple)

EduClaw is a multi-role AI-assisted learning platform with a strong governance model.

From the frontend, the core product shape is:
- **Student learning companion** (guided conversation flow)
- **Faculty policy authoring + flagged turn review**
- **Advisor caseload + intervention view**
- **Admin tenant/integration/KPI operations**
- **Auditor trace + FERPA consent auditability**

The frontend currently uses mock data, but it clearly defines the backend requirements: role-based access, JWT auth, policy-controlled responses, learning state, and end-to-end turn traceability.

---

## 2) Frontend Modules and User Flows Extracted

## Core Modules
- Authentication & session
- User/role management (Student, Faculty, Advisor, Admin, Auditor)
- Courses and outcomes
- Guided Learning Cycle (Notice → Diagnose → Ask → Act → Check → Reflect)
- Validation Policy management
- Flagged Turn review workflow
- Learner State (goals, mastery, reflections)
- Privacy/Consent ledger
- Audit/trace explorer
- LMS/chat/mobile surface integrations (backend mostly shared APIs)

## Primary User Flows

### Student
1. Login
2. Open dashboard/courses
3. Start conversation turn
4. System produces diagnosis, clarifying question, response, validation verdict, reflection prompt
5. Student view updates mastery/reflection context
6. Student manages privacy/consent scopes

### Faculty
1. Login
2. Author/update validation policy by course/assignment
3. Review flagged turns
4. Approve/override/escalate and leave note

### Advisor
1. Login
2. View caseload and student risk context
3. Access consent-permitted student learning summary

### Admin
1. Login
2. Manage users/roles, integration status, KPIs, audits

### Auditor
1. Login
2. Read trace explorer (agent hops)
3. Review FERPA consent scope history

---

## 3) Backend Architecture Recommendation (Clean Architecture)

## Architectural Style
- **Clean Architecture + Modular Monolith first**
- Extract to services later only if scale requires

## Layers
- **Domain**: entities, value objects, domain services, business rules
- **Application**: use-cases/interactors, DTOs, orchestration
- **Infrastructure**: DB, cache, message bus, external integrations (SSO/LMS)
- **Interface**: REST controllers, auth guards, request validators, presenters

## Why this fit
- EduClaw has heavy policy/governance logic; clean boundaries keep policy/validation logic testable.
- Multi-role authorization and audit concerns are easier to enforce in application/domain layers.
- Frontend mock models map naturally to domain entities.

## Proposed Tech Stack (suggested)
- Runtime: Node.js + TypeScript
- Framework: NestJS or Fastify + dependency injection
- DB: PostgreSQL
- Cache/queue: Redis (optional early)
- ORM: Prisma/Drizzle/TypeORM (pick one)
- Auth: JWT (access + refresh), SSO federation adapters
- Observability: OpenTelemetry + structured logs

---

## 4) API Design (REST) by Feature

## 4.1 Authentication & Session

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Exchange SSO/assertion for JWT |
| POST | `/api/v1/auth/refresh` | Refresh token | Rotate access token |
| POST | `/api/v1/auth/logout` | JWT | Revoke refresh token/session |
| GET | `/api/v1/auth/me` | JWT | Current user profile + roles |

**POST /auth/login request**
```json
{
  "provider": "okta",
  "idToken": "...",
  "device": "web"
}
```

**POST /auth/login response**
```json
{
  "accessToken": "jwt-access",
  "refreshToken": "jwt-refresh",
  "expiresIn": 900,
  "user": {
    "id": "usr_1",
    "name": "Maya Chen",
    "email": "maya@example.edu",
    "roles": ["student"]
  }
}
```

## 4.2 Users, Roles, and Roster

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/users/:id` | JWT | self/admin/faculty(advised scope) |
| GET | `/api/v1/users` | JWT | admin |
| PUT | `/api/v1/users/:id/roles` | JWT | admin |
| GET | `/api/v1/courses/:courseId/roster` | JWT | faculty/admin |

## 4.3 Courses, Outcomes, Materials

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/courses` | JWT | List courses by role enrollment |
| GET | `/api/v1/courses/:courseId` | JWT | Course detail |
| GET | `/api/v1/courses/:courseId/outcomes` | JWT | Outcome map |
| GET | `/api/v1/courses/:courseId/materials` | JWT | Citation-eligible materials |

## 4.4 Guided Conversation (Core Orchestration)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/conversations` | JWT | Start conversation context |
| GET | `/api/v1/conversations/:id` | JWT | Conversation metadata |
| GET | `/api/v1/conversations/:id/turns` | JWT | Turn history |
| POST | `/api/v1/conversations/:id/turns` | JWT | Submit student prompt and run full pipeline |
| GET | `/api/v1/turns/:turnId/trace` | JWT | Agent hop trace (faculty/auditor scoped) |

**POST /conversations/:id/turns request**
```json
{
  "message": "I don't get problem 3. Can you show me?",
  "courseId": "crs_math_1550",
  "assignmentId": "hw5",
  "selectedChip": null
}
```

**POST /conversations/:id/turns response**
```json
{
  "turnId": "turn_123",
  "studentInput": "I don't get problem 3. Can you show me?",
  "inference": {
    "intent": "seeking direct solution",
    "knowledgeGap": "chain rule composition",
    "urgency": "medium",
    "confidence": 0.81
  },
  "dialogue": {
    "question": "Which part feels most unclear?",
    "chips": ["Inner vs outer function", "Derivative order", "Something else"]
  },
  "execution": {
    "scaffold": "Let's solve a similar problem first...",
    "workedExamples": ["..."],
    "citations": [
      {"source": "Stewart Ch.3", "url": "https://..."}
    ]
  },
  "validation": {
    "status": "modified",
    "reason": "No final answers for graded homework",
    "studentFacingMessage": "I can guide with a similar example instead."
  },
  "reflection": {
    "prompt": "How would you explain chain rule in one sentence?",
    "optional": true
  }
}
```

## 4.5 Validation Policy Management

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/policies?courseId=&assignmentId=` | JWT | faculty/admin |
| POST | `/api/v1/policies` | JWT | faculty/admin |
| GET | `/api/v1/policies/:policyId` | JWT | faculty/admin |
| PUT | `/api/v1/policies/:policyId` | JWT | faculty/admin |
| DELETE | `/api/v1/policies/:policyId` | JWT | faculty/admin |
| POST | `/api/v1/policies/:policyId/publish` | JWT | faculty/admin |

**Policy payload (create/update)**
```json
{
  "courseId": "crs_math_1550",
  "assignmentId": "hw5",
  "title": "MATH 1550 HW5 Guardrails",
  "clauses": [
    {
      "rule": "Do not provide final answer to graded problems",
      "when": "student requests direct answer",
      "onViolation": "modify"
    },
    {
      "rule": "Block ghostwritten reflections",
      "when": "student asks to write reflection for them",
      "onViolation": "block"
    }
  ]
}
```

## 4.6 Flagged Turns Review Workflow

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/reviews/flagged?courseId=&status=` | JWT | faculty/admin |
| GET | `/api/v1/reviews/flagged/:flagId` | JWT | faculty/admin |
| POST | `/api/v1/reviews/flagged/:flagId/decision` | JWT | faculty/admin |

**Decision request**
```json
{
  "decision": "override",
  "note": "Allowed due to non-graded practice context"
}
```

## 4.7 Learner State, Mastery, Reflection

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/learners/:learnerId/state` | JWT | self/faculty(advised)/advisor(consented) |
| PUT | `/api/v1/learners/:learnerId/goals` | JWT | self |
| GET | `/api/v1/learners/:learnerId/mastery` | JWT | self/faculty/advisor(consented) |
| POST | `/api/v1/learners/:learnerId/reflections` | JWT | self |
| GET | `/api/v1/learners/:learnerId/reflections` | JWT | self/faculty/advisor(consented) |

## 4.8 Privacy & Consent Ledger (FERPA-sensitive)

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/consents/me` | JWT | self |
| PUT | `/api/v1/consents/me` | JWT | self |
| GET | `/api/v1/consents/me/history` | JWT | self/auditor(admin scoped) |
| GET | `/api/v1/audit/ferpa-scope` | JWT | auditor/admin |

**PUT /consents/me request**
```json
{
  "scopes": [
    {"key": "course_context", "enabled": true},
    {"key": "prior_conversations", "enabled": true},
    {"key": "advisor_visibility", "enabled": false},
    {"key": "third_party_tools", "enabled": false}
  ],
  "reason": "semester preference update"
}
```

## 4.9 Admin KPIs, Integrations, Audit

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| GET | `/api/v1/admin/kpis` | JWT | admin |
| GET | `/api/v1/admin/integrations` | JWT | admin |
| PUT | `/api/v1/admin/integrations/:name` | JWT | admin |
| GET | `/api/v1/admin/audit-logs` | JWT | admin |

---

## 5) Authentication and Authorization Model (JWT)

## Token Strategy
- Access token: short TTL (10–15 min)
- Refresh token: longer TTL (7–30 days), rotation enabled
- Store refresh token hash in DB (never plaintext)
- Add `jti`, `sub`, `role`, `tenantId`, `scope`, `exp` claims

## Authorization
- RBAC at route guard level
- ABAC checks for sensitive learner data:
  - role permission
  - course membership
  - consent scope
  - data ownership

## Security Controls
- Passwordless SSO exchange only (institution IdP)
- Rate limit auth and conversation endpoints
- Audit log all policy changes, consent changes, override decisions
- Encrypt sensitive fields at rest where required

---

## 6) Database Design (Initial)

## Core Entities (tables)

| Table | Purpose |
|---|---|
| `users` | User identity profile |
| `roles` | Role definitions |
| `user_roles` | Many-to-many user-role mapping |
| `courses` | Course metadata |
| `course_enrollments` | User-course relationships |
| `outcomes` | Course learning outcomes |
| `materials` | Course material/citation sources |
| `conversations` | Conversation container |
| `conversation_turns` | Each student turn and outputs |
| `agent_hops` | Inference/Dialogue/Execution/Validation/Reflection trace events |
| `validation_policies` | Policy header |
| `policy_clauses` | Clause-level rules |
| `flagged_turns` | Turn review queue entries |
| `review_decisions` | Faculty/admin decisions |
| `learner_goals` | Student goals |
| `learner_mastery` | Outcome mastery states |
| `reflection_entries` | Reflection journal entries |
| `consent_scopes` | Current consent flags per learner |
| `consent_events` | Consent change ledger/history |
| `audit_logs` | Cross-system immutable audit events |
| `sessions` | Refresh token sessions |

## Minimal Relationship Notes
- `users 1..* user_roles *..1 roles`
- `users *..* courses` via `course_enrollments`
- `conversations 1..* conversation_turns`
- `conversation_turns 1..* agent_hops`
- `validation_policies 1..* policy_clauses`
- `conversation_turns 0..1 flagged_turns`
- `users 1..* consent_events`

---

## 7) Validation and Error Handling

## Request Validation
- JSON schema/Zod/class-validator at controller boundary
- Strict enum checks: roles, verdict status, decision types
- Input constraints:
  - message length, profanity/safety checks as policy dictates
  - policy clause field max lengths
  - pagination bounds for list endpoints

## Domain Validation
- Cannot publish empty policy
- Cannot review flag outside faculty course scope
- Cannot expose learner state to advisor without consent
- Cannot create turn without active enrollment in course

## Error Contract (consistent)

```json
{
  "error": {
    "code": "POLICY_VIOLATION",
    "message": "Response blocked by active course policy",
    "details": {
      "policyId": "pol_1",
      "clauseId": "cl_2"
    },
    "requestId": "req_abc123",
    "timestamp": "2026-05-12T10:00:00Z"
  }
}
```

## Suggested HTTP status mapping
- `400` bad input
- `401` unauthenticated
- `403` forbidden (RBAC/consent failure)
- `404` not found
- `409` conflict (state race / duplicate publish)
- `422` semantically invalid business rule
- `429` rate limited
- `500` internal

---

## 8) Suggested Backend Folder Structure

```text
EduClawBackend/
  src/
    main.ts
    app.module.ts

    modules/
      auth/
        domain/
        application/
        infrastructure/
        interface/
      users/
      courses/
      conversations/
      policies/
      reviews/
      learner-state/
      consent/
      admin/
      audit/

    shared/
      domain/
        base-entity.ts
        domain-error.ts
      application/
        use-case.ts
        dto/
      infrastructure/
        db/
          prisma/
        cache/
        queue/
        logger/
      interface/
        http/
          guards/
          interceptors/
          filters/
          validators/

    config/
      env.schema.ts
      auth.config.ts
      db.config.ts

    test/
      unit/
      integration/
      e2e/
```

---

## 9) API Development Plan (Step-by-Step)

## Phase 0: Foundation
1. Initialize backend project (TS, lint, test, formatting)
2. Add env config + secret management
3. Setup PostgreSQL + migrations
4. Add common error format, logger, request-id middleware

## Phase 1: Auth + RBAC
1. Implement `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me`
2. Add JWT guard + role guard + ownership/consent policy checks
3. Seed users/roles/courses/enrollments

## Phase 2: Core Read APIs
1. Courses, outcomes, materials endpoints
2. Learner state read endpoints
3. Consent read/update endpoints

## Phase 3: Guided Conversation APIs
1. Create conversation + turn submission endpoint
2. Implement orchestrator use-case (mock internal agents first)
3. Persist turn outputs + agent hops
4. Add trace endpoint

## Phase 4: Policy Engine
1. CRUD + publish endpoints for validation policies
2. Clause parser/evaluator service
3. Integrate policy evaluator into turn pipeline
4. Emit flagged turns for violations/reviews

## Phase 5: Faculty Review Workflow
1. Flagged queue listing/detail endpoints
2. Decision endpoint (approve/override/escalate)
3. Append review decision audit events

## Phase 6: Mastery/Reflection
1. Goal and reflection APIs
2. Mastery read API and update hooks from turn completion
3. Add pagination/filtering for history

## Phase 7: Admin/Auditor APIs
1. KPI aggregation endpoints
2. Integration status APIs
3. Audit/FERPA scope explorer endpoints

## Phase 8: Hardening
1. Add rate limits, idempotency keys for sensitive writes
2. Add integration tests for RBAC + consent + policy edge cases
3. Add observability dashboards and alerts
4. Security review and penetration test remediation

---

## 10) Non-Functional Requirements Checklist

- Performance: P95 turn pipeline under target SLA (e.g., <2.5s excluding LLM latency)
- Reliability: retries + circuit breaking around external integrations
- Auditability: immutable audit logs for policy/consent/review actions
- Privacy: FERPA-sensitive access checks in every learner-data endpoint
- Scalability: stateless API instances + DB indexing on turn, user, course, and consent lookups

---

## 11) Immediate Next Implementation Order (Practical)

1. Auth + RBAC + enrollment checks
2. Policy CRUD + publish
3. Conversation turn endpoint with mock orchestrator internals
4. Flagged review workflow
5. Consent ledger + learner state APIs
6. Admin/auditor endpoints and KPIs

This sequence will let the frontend transition from mock provider to real APIs incrementally without blocking core demo flows.
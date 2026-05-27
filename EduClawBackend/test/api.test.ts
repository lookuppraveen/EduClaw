import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/db/prisma.js";
import { findFlaggedTurnByTurnId } from "../src/repositories/prisma/flagged-turn.repository.js";

const loginAs = async (email: string) => {
  return request(app)
    .post("/api/v1/auth/login")
    .send({ provider: "okta", idToken: "token", email, device: "web" });
};

describe("EduClaw backend APIs", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("propagates W3C trace context on responses", async () => {
    const traceId = "11111111111111111111111111111111";
    const parentSpanId = "2222222222222222";

    const response = await request(app)
      .get("/api/v1/health")
      .set("traceparent", `00-${traceId}-${parentSpanId}-01`);

    expect(response.status).toBe(200);
    expect(response.headers.traceparent).toMatch(new RegExp(`^00-${traceId}-[a-f0-9]{16}-01$`));
    expect(response.headers.traceparent).not.toContain(parentSpanId);
  });

  it("sets baseline security headers and suppresses framework disclosure", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["x-powered-by"]).toBeUndefined();
  });

  it("rate limits repeated requests from the same client bucket", async () => {
    const clientId = "rate-limit-test-client";
    let response = await request(app).get("/api/v1/health").set("x-client-id", clientId);

    for (let index = 0; index < 100; index += 1) {
      response = await request(app).get("/api/v1/health").set("x-client-id", clientId);
    }

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("RATE_LIMITED");
    expect(response.headers["ratelimit-limit"]).toBe("100");
  });

  it("supports auth login and me", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeTypeOf("string");

    const meResponse = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe("maya@example.edu");
  });

  it("rejects mock SSO login without an explicit email", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ provider: "okta", idToken: "token", device: "web" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns controlled auth errors for malformed refresh and logout tokens", async () => {
    const refreshResponse = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "not-a-jwt" });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");

    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .send({ refreshToken: "not-a-jwt" });

    expect(logoutResponse.status).toBe(401);
    expect(logoutResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });

  it("denies courses endpoint without token", async () => {
    const response = await request(app).get("/api/v1/courses");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_UNAUTHORIZED");
  });

  it("lists only enrolled courses for student", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/courses")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.courses).toHaveLength(2);
    expect(response.body.courses[0]).toHaveProperty("id");
    expect(response.body.courses[0]).not.toHaveProperty("outcomes");
  });

  it("lists all courses for admin", async () => {
    const loginResponse = await loginAs("admin@example.edu");

    const response = await request(app)
      .get("/api/v1/courses")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.courses).toHaveLength(3);
  });

  it("returns course details and nested resources for enrolled user", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const courseResponse = await request(app)
      .get("/api/v1/courses/crs_math_1550")
      .set("Authorization", `Bearer ${token}`);

    expect(courseResponse.status).toBe(200);
    expect(courseResponse.body.course.code).toBe("MATH 1550");

    const outcomesResponse = await request(app)
      .get("/api/v1/courses/crs_math_1550/outcomes")
      .set("Authorization", `Bearer ${token}`);

    expect(outcomesResponse.status).toBe(200);
    expect(outcomesResponse.body.outcomes.length).toBeGreaterThan(0);

    const materialsResponse = await request(app)
      .get("/api/v1/courses/crs_math_1550/materials")
      .set("Authorization", `Bearer ${token}`);

    expect(materialsResponse.status).toBe(200);
    expect(materialsResponse.body.materials.length).toBeGreaterThan(0);
  });

  it("supports faculty and admin course roster reads", async () => {
    const facultyLogin = await loginAs("carter@example.edu");

    const facultyRoster = await request(app)
      .get("/api/v1/courses/crs_math_1550/roster")
      .set("Authorization", `Bearer ${facultyLogin.body.accessToken}`);

    expect(facultyRoster.status).toBe(200);
    expect(facultyRoster.body.roster.some((entry: { user: { id: string }; role: string }) => entry.user.id === "usr_student_1" && entry.role === "student")).toBe(true);
    expect(facultyRoster.body.roster.some((entry: { user: { id: string }; role: string }) => entry.user.id === "usr_faculty_1" && entry.role === "faculty")).toBe(true);

    const adminLogin = await loginAs("admin@example.edu");
    const adminRoster = await request(app)
      .get("/api/v1/courses/crs_hist_2000/roster")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(adminRoster.status).toBe(200);
    expect(Array.isArray(adminRoster.body.roster)).toBe(true);

    const studentLogin = await loginAs("maya@example.edu");
    const deniedRoster = await request(app)
      .get("/api/v1/courses/crs_math_1550/roster")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`);

    expect(deniedRoster.status).toBe(403);
    expect(deniedRoster.body.error.code).toBe("ROSTER_FORBIDDEN");
  });

  it("returns forbidden for non-enrolled existing course", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/courses/crs_hist_2000")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("COURSE_FORBIDDEN");
  });

  it("supports user profile reads by self, admin, and scoped faculty", async () => {
    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const selfResponse = await request(app)
      .get("/api/v1/users/usr_student_1")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(selfResponse.status).toBe(200);
    expect(selfResponse.body.user.email).toBe("maya@example.edu");

    const forbiddenList = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${studentToken}`);

    expect(forbiddenList.status).toBe(403);
    expect(forbiddenList.body.error.code).toBe("USER_FORBIDDEN");

    const adminLogin = await loginAs("admin@example.edu");
    const listResponse = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.users).toHaveLength(6);

    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const scopedResponse = await request(app)
      .get("/api/v1/users/usr_student_1")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(scopedResponse.status).toBe(200);
    expect(scopedResponse.body.user.id).toBe("usr_student_1");

    const unscopedResponse = await request(app)
      .get("/api/v1/users/usr_student_2")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(unscopedResponse.status).toBe(403);
    expect(unscopedResponse.body.error.code).toBe("USER_FORBIDDEN");
  });

  it("allows admins to update user roles and emits audit events", async () => {
    const adminLogin = await loginAs("admin@example.edu");
    const adminToken = adminLogin.body.accessToken;

    const updateResponse = await request(app)
      .put("/api/v1/users/usr_student_2/roles")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ roles: ["advisor"] });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.user.roles).toEqual(["advisor"]);

    const auditResponse = await request(app)
      .get("/api/v1/admin/audit-logs?action=user.roles.update")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.logs.some((log: { targetId: string | null }) => log.targetId === "usr_student_2")).toBe(true);

    const studentLogin = await loginAs("maya@example.edu");
    const forbiddenResponse = await request(app)
      .put("/api/v1/users/usr_student_2/roles")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`)
      .send({ roles: ["student"] });

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.error.code).toBe("USER_FORBIDDEN");
  });

  it("allows student to read own learner state and mastery", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const stateResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${token}`);

    expect(stateResponse.status).toBe(200);
    expect(stateResponse.body.learnerId).toBe("usr_student_1");

    const masteryResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/mastery")
      .set("Authorization", `Bearer ${token}`);

    expect(masteryResponse.status).toBe(200);
    expect(masteryResponse.body.mastery.length).toBeGreaterThan(0);
  });

  it("allows student to update own learner goals", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const response = await request(app)
      .put("/api/v1/learners/usr_student_1/goals")
      .set("Authorization", `Bearer ${token}`)
      .send({
        goals: [
          { text: "Practice chain rule setup without looking at examples" },
          { text: "Review product rule comparison before quiz" }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.learnerId).toBe("usr_student_1");
    expect(response.body.goals).toHaveLength(2);
    expect(response.body.goals[0].text).toBe("Practice chain rule setup without looking at examples");

    const stateResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${token}`);

    expect(stateResponse.status).toBe(200);
    expect(stateResponse.body.goals).toHaveLength(2);
  });

  it("allows student to create own reflection entries", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/v1/learners/usr_student_1/reflections")
      .set("Authorization", `Bearer ${token}`)
      .send({
        prompt: "What helped chain rule click today?",
        response: "Separating inner and outer functions before differentiating.",
        kind: "metacognitive"
      });

    expect(response.status).toBe(201);
    expect(response.body.learnerId).toBe("usr_student_1");
    expect(response.body.reflection.prompt).toBe("What helped chain rule click today?");

    const reflectionsResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/reflections")
      .set("Authorization", `Bearer ${token}`);

    expect(reflectionsResponse.status).toBe(200);
    expect(reflectionsResponse.body.reflections.some((item: { id: string }) => item.id === response.body.reflection.id)).toBe(true);
  });

  it("paginates and filters learner reflections", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    for (const [index, kind] of ["metacognitive", "metacognitive", "goal_check"].entries()) {
      const response = await request(app)
        .post("/api/v1/learners/usr_student_1/reflections")
        .set("Authorization", `Bearer ${token}`)
        .send({
          prompt: `Reflection prompt ${index}`,
          response: `Reflection response ${index}`,
          kind
        });

      expect(response.status).toBe(201);
    }

    const firstPage = await request(app)
      .get("/api/v1/learners/usr_student_1/reflections?kind=metacognitive&limit=2")
      .set("Authorization", `Bearer ${token}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.reflections).toHaveLength(2);
    expect(firstPage.body.reflections.every((item: { kind: string }) => item.kind === "metacognitive")).toBe(true);
    expect(firstPage.body.page.limit).toBe(2);
    expect(firstPage.body.page.nextCursor).toBeTypeOf("string");

    const secondPage = await request(app)
      .get(`/api/v1/learners/usr_student_1/reflections?kind=metacognitive&limit=2&cursor=${firstPage.body.page.nextCursor}`)
      .set("Authorization", `Bearer ${token}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.reflections).toHaveLength(1);
    expect(secondPage.body.page.nextCursor).toBeNull();
  });

  it("blocks learner-state writes for other users", async () => {
    const loginResponse = await loginAs("advisor@example.edu");

    const response = await request(app)
      .put("/api/v1/learners/usr_student_1/goals")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({ goals: ["Attempt two similar examples before asking for hints"] });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("LEARNER_STATE_FORBIDDEN");
  });

  it("allows faculty with shared course to read learner state", async () => {
    const loginResponse = await loginAs("carter@example.edu");

    const response = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.learnerId).toBe("usr_student_1");
  });

  it("blocks advisor without consent for learner state", async () => {
    const loginResponse = await loginAs("advisor@example.edu");

    const response = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("allows advisor after learner enables advisor_visibility consent", async () => {
    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const updateConsent = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        scopes: [
          { key: "course_context", enabled: true },
          { key: "prior_conversations", enabled: true },
          { key: "advisor_visibility", enabled: true },
          { key: "third_party_tools", enabled: false }
        ],
        reason: "Allow advisor support"
      });

    expect(updateConsent.status).toBe(200);

    const advisorLogin = await loginAs("advisor@example.edu");

    const stateResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${advisorLogin.body.accessToken}`);

    expect(stateResponse.status).toBe(200);
  });

  it("blocks advisor learner-state access when consent exists but shared context is missing", async () => {
    const advisorLogin = await loginAs("advisor@example.edu");

    const response = await request(app)
      .get("/api/v1/learners/usr_student_2/state")
      .set("Authorization", `Bearer ${advisorLogin.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("LEARNER_STATE_FORBIDDEN");
  });

  it("blocks auditor from raw learner state while preserving FERPA explorer access", async () => {
    const auditorLogin = await loginAs("auditor@example.edu");
    const token = auditorLogin.body.accessToken;

    const stateResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/state")
      .set("Authorization", `Bearer ${token}`);

    expect(stateResponse.status).toBe(403);
    expect(stateResponse.body.error.code).toBe("LEARNER_STATE_FORBIDDEN");

    const ferpaResponse = await request(app)
      .get("/api/v1/audit/ferpa-scope?learnerId=usr_student_1")
      .set("Authorization", `Bearer ${token}`);

    expect(ferpaResponse.status).toBe(200);
    expect(ferpaResponse.body.records).toHaveLength(1);
  });

  it("supports consent read/update/history for learner", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const meConsent = await request(app)
      .get("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meConsent.status).toBe(200);
    expect(meConsent.body.consent.learnerId).toBe("usr_student_1");

    const updateResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        scopes: [
          { key: "course_context", enabled: true },
          { key: "prior_conversations", enabled: true },
          { key: "advisor_visibility", enabled: false },
          { key: "third_party_tools", enabled: true }
        ],
        reason: "Update preferences"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.consent.scopes.find((s: { key: string; enabled: boolean }) => s.key === "third_party_tools")?.enabled).toBe(true);

    const historyResponse = await request(app)
      .get("/api/v1/consents/me/history")
      .set("Authorization", `Bearer ${token}`);

    expect(historyResponse.status).toBe(200);
    expect(Array.isArray(historyResponse.body.events)).toBe(true);
    expect(historyResponse.body.events.length).toBeGreaterThan(0);
  });

  it("requires complete unique consent scopes on update", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const partialResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        scopes: [
          { key: "advisor_visibility", enabled: true }
        ],
        reason: "Partial update should be rejected"
      });

    expect(partialResponse.status).toBe(400);
    expect(partialResponse.body.error.code).toBe("VALIDATION_ERROR");

    const duplicateResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        scopes: [
          { key: "course_context", enabled: true },
          { key: "course_context", enabled: false },
          { key: "advisor_visibility", enabled: true },
          { key: "third_party_tools", enabled: false }
        ],
        reason: "Duplicate update should be rejected"
      });

    expect(duplicateResponse.status).toBe(400);
    expect(duplicateResponse.body.error.code).toBe("VALIDATION_ERROR");

    const consentResponse = await request(app)
      .get("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`);

    expect(consentResponse.status).toBe(200);
    expect(consentResponse.body.consent.scopes.find((s: { key: string; enabled: boolean }) => s.key === "advisor_visibility")?.enabled).toBe(false);
  });

  it("replays idempotent sensitive writes and rejects key reuse with different payload", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;
    const idempotencyKey = "consent-update-idempotency-test";
    const payload = {
      scopes: [
        { key: "course_context", enabled: true },
        { key: "prior_conversations", enabled: true },
        { key: "advisor_visibility", enabled: true },
        { key: "third_party_tools", enabled: false }
      ],
      reason: "Idempotent advisor support update"
    };

    const firstResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(200);

    const replayResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(replayResponse.status).toBe(200);
    expect(replayResponse.headers["idempotency-replayed"]).toBe("true");
    expect(replayResponse.body).toEqual(firstResponse.body);

    const conflictResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey)
      .send({
        ...payload,
        reason: "Different body with reused key"
      });

    expect(conflictResponse.status).toBe(409);
    expect(conflictResponse.body.error.code).toBe("IDEMPOTENCY_CONFLICT");

    const historyResponse = await request(app)
      .get("/api/v1/consents/me/history")
      .set("Authorization", `Bearer ${token}`);

    expect(historyResponse.body.events.filter((event: { reason: string | null }) => event.reason === payload.reason)).toHaveLength(1);
  });

  it("emits audit events for consent and learner-state mutations", async () => {
    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const consentResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        scopes: [
          { key: "course_context", enabled: true },
          { key: "prior_conversations", enabled: true },
          { key: "advisor_visibility", enabled: true },
          { key: "third_party_tools", enabled: false }
        ],
        reason: "Audit event test"
      });

    expect(consentResponse.status).toBe(200);

    const goalsResponse = await request(app)
      .put("/api/v1/learners/usr_student_1/goals")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ goals: ["Prepare for the next calculus review"] });

    expect(goalsResponse.status).toBe(200);

    const adminLogin = await loginAs("admin@example.edu");
    const adminToken = adminLogin.body.accessToken;

    const consentAudit = await request(app)
      .get("/api/v1/admin/audit-logs?action=consent.update")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(consentAudit.status).toBe(200);
    expect(consentAudit.body.logs.some((log: { targetId: string | null }) => log.targetId === "usr_student_1")).toBe(true);

    const goalsAudit = await request(app)
      .get("/api/v1/admin/audit-logs?action=learner.goals.update")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(goalsAudit.status).toBe(200);
    expect(goalsAudit.body.logs.some((log: { targetId: string | null }) => log.targetId === "usr_student_1")).toBe(true);
  });

  it("creates conversation and allows learner to get it and list turns", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_1"
      });

    expect(createConversationResponse.status).toBe(201);
    const conversationId = createConversationResponse.body.conversation.id as string;

    const getConversationResponse = await request(app)
      .get(`/api/v1/conversations/${conversationId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getConversationResponse.status).toBe(200);
    expect(getConversationResponse.body.conversation.learnerId).toBe("usr_student_1");

    const listTurnsResponse = await request(app)
      .get(`/api/v1/conversations/${conversationId}/turns`)
      .set("Authorization", `Bearer ${token}`);

    expect(listTurnsResponse.status).toBe(200);
    expect(Array.isArray(listTurnsResponse.body.turns)).toBe(true);
  });

  it("enforces faculty conversation access for the exact course context", async () => {
    await prisma.user.create({
      data: {
        id: "usr_faculty_math_only",
        name: "Math Only Faculty",
        email: "math-only@example.edu",
        role: "faculty"
      }
    });
    await prisma.enrollment.create({
      data: {
        userId: "usr_faculty_math_only",
        courseId: "crs_math_1550",
        role: "faculty"
      }
    });

    const studentLogin = await loginAs("maya@example.edu");
    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_eng_1010",
        assignmentId: "asg_essay_scope"
      });

    expect(createConversationResponse.status).toBe(201);

    const facultyLogin = await loginAs("math-only@example.edu");
    const response = await request(app)
      .get(`/api/v1/conversations/${createConversationResponse.body.conversation.id}`)
      .set("Authorization", `Bearer ${facultyLogin.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CONVERSATION_FORBIDDEN");
  });

  it("creates turn through orchestrator pipeline and returns trace", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_2"
      });

    const conversationId = createConversationResponse.body.conversation.id as string;

    const createTurnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationId}/turns`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Please show me how chain rule works",
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_2",
        selectedChip: "Inner vs outer function"
      });

    expect(createTurnResponse.status).toBe(201);
    expect(createTurnResponse.body.turn.validation.status).toBeTypeOf("string");
    expect(createTurnResponse.body.turn.execution.workedExamples.length).toBeGreaterThan(0);

    const turnId = createTurnResponse.body.turn.id as string;

    const traceResponse = await request(app)
      .get(`/api/v1/turns/${turnId}/trace`)
      .set("Authorization", `Bearer ${token}`);

    expect(traceResponse.status).toBe(200);
    expect(traceResponse.body.trace).toHaveLength(5);
  });

  it("requires course context consent before running the turn pipeline", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_course_context_consent"
      });

    expect(createConversationResponse.status).toBe(201);

    const consentResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${token}`)
      .send({
        scopes: [
          { key: "course_context", enabled: false },
          { key: "prior_conversations", enabled: true },
          { key: "advisor_visibility", enabled: false },
          { key: "third_party_tools", enabled: false }
        ],
        reason: "Disable course context for this session"
      });

    expect(consentResponse.status).toBe(200);

    const turnResponse = await request(app)
      .post(`/api/v1/conversations/${createConversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Please help me with the chain rule assignment",
        courseId: "crs_math_1550",
        assignmentId: "asg_course_context_consent",
        selectedChip: null
      });

    expect(turnResponse.status).toBe(403);
    expect(turnResponse.body.error.code).toBe("CONSENT_REQUIRED");
  });

  it("updates learner mastery after completed conversation turn", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const initialMasteryResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/mastery")
      .set("Authorization", `Bearer ${token}`);

    expect(initialMasteryResponse.status).toBe(200);
    const initialChainRule = initialMasteryResponse.body.mastery.find((item: { outcomeId: string }) => item.outcomeId === "out_math_chain_rule");
    expect(initialChainRule.score).toBe(0.62);

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_mastery_update"
      });

    const createTurnResponse = await request(app)
      .post(`/api/v1/conversations/${createConversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Can you help me understand chain rule composition?",
        courseId: "crs_math_1550",
        assignmentId: "asg_mastery_update",
        selectedChip: null
      });

    expect(createTurnResponse.status).toBe(201);

    const updatedMasteryResponse = await request(app)
      .get("/api/v1/learners/usr_student_1/mastery")
      .set("Authorization", `Bearer ${token}`);

    expect(updatedMasteryResponse.status).toBe(200);
    const updatedChainRule = updatedMasteryResponse.body.mastery.find((item: { outcomeId: string }) => item.outcomeId === "out_math_chain_rule");
    expect(updatedChainRule.score).toBeGreaterThan(initialChainRule.score);
    expect(updatedChainRule.evidence).toBe(`Conversation turn ${createTurnResponse.body.turn.id}`);
  });

  it("enforces trace visibility by role", async () => {
    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_3"
      });

    const conversationId = createConversationResponse.body.conversation.id as string;

    const createTurnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationId}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "Give me the answer directly",
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_3",
        selectedChip: null
      });

    const turnId = createTurnResponse.body.turn.id as string;

    const studentTrace = await request(app)
      .get(`/api/v1/turns/${turnId}/trace`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(studentTrace.status).toBe(200);
    expect(studentTrace.body.trace[0].internalDetails).toBe("hidden");

    const facultyLogin = await loginAs("carter@example.edu");
    const facultyTrace = await request(app)
      .get(`/api/v1/turns/${turnId}/trace`)
      .set("Authorization", `Bearer ${facultyLogin.body.accessToken}`);

    expect(facultyTrace.status).toBe(200);
    const validationHop = facultyTrace.body.trace.find((h: { agent: string }) => h.agent === "validation");
    const inferenceHop = facultyTrace.body.trace.find((h: { agent: string }) => h.agent === "inference");
    expect(validationHop.internalDetails).not.toBe("hidden");
    expect(inferenceHop.internalDetails).toBe("hidden");

    const adminLogin = await loginAs("admin@example.edu");
    const adminTrace = await request(app)
      .get(`/api/v1/turns/${turnId}/trace`)
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(adminTrace.status).toBe(200);
    expect(adminTrace.body.trace[0].internalDetails).not.toBe("hidden");

    const auditorLogin = await loginAs("auditor@example.edu");
    const auditorTrace = await request(app)
      .get(`/api/v1/turns/${turnId}/trace`)
      .set("Authorization", `Bearer ${auditorLogin.body.accessToken}`);

    expect(auditorTrace.status).toBe(200);
    expect(auditorTrace.body.trace[0].internalDetails).not.toBe("hidden");
  });

  it("requires prior conversation consent for faculty trace access", async () => {
    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const createConversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_prior_consent"
      });

    const createTurnResponse = await request(app)
      .post(`/api/v1/conversations/${createConversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "Can you help me understand chain rule?",
        courseId: "crs_math_1550",
        assignmentId: "asg_prior_consent",
        selectedChip: null
      });

    expect(createTurnResponse.status).toBe(201);

    const consentResponse = await request(app)
      .put("/api/v1/consents/me")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        scopes: [
          { key: "course_context", enabled: true },
          { key: "prior_conversations", enabled: false },
          { key: "advisor_visibility", enabled: false },
          { key: "third_party_tools", enabled: false }
        ],
        reason: "Limit historical conversation visibility"
      });

    expect(consentResponse.status).toBe(200);

    const facultyLogin = await loginAs("carter@example.edu");
    const facultyTrace = await request(app)
      .get(`/api/v1/turns/${createTurnResponse.body.turn.id}/trace`)
      .set("Authorization", `Bearer ${facultyLogin.body.accessToken}`);

    expect(facultyTrace.status).toBe(403);
    expect(facultyTrace.body.error.code).toBe("CONSENT_REQUIRED");

    const studentTrace = await request(app)
      .get(`/api/v1/turns/${createTurnResponse.body.turn.id}/trace`)
      .set("Authorization", `Bearer ${studentToken}`);

    expect(studentTrace.status).toBe(200);
  });


  it("evaluates published policies during turn processing and emits flagged review events", async () => {
    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const policyResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_eval",
        title: "Policy Evaluation Guardrails",
        clauses: [
          {
            rule: "Guide with analogous examples instead of final answers",
            when: "student asks for direct answer",
            onViolation: "modify"
          }
        ]
      });

    expect(policyResponse.status).toBe(201);
    const policyId = policyResponse.body.policy.id as string;

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${policyId}/publish`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(publishResponse.status).toBe(200);

    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const conversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_eval"
      });

    expect(conversationResponse.status).toBe(201);
    const conversationId = conversationResponse.body.conversation.id as string;

    const turnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationId}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "Can you give me the direct answer?",
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_eval",
        selectedChip: null
      });

    expect(turnResponse.status).toBe(201);
    expect(turnResponse.body.turn.validation.status).toBe("modified");
    expect(turnResponse.body.turn.validation.reason).toContain("Policy Evaluation Guardrails");

    const flagged = await findFlaggedTurnByTurnId(turnResponse.body.turn.id as string);
    expect(flagged?.policyId).toBe(policyId);
    expect(flagged?.status).toBe("pending");
  });

  it("applies course-level published policies across assignments", async () => {
    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const policyResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        courseId: "crs_math_1550",
        title: "Course Wide Direct Answer Guardrails",
        clauses: [
          {
            rule: "Guide with analogous examples instead of final answers",
            when: "student asks for direct answer",
            onViolation: "modify"
          }
        ]
      });

    expect(policyResponse.status).toBe(201);

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${policyResponse.body.policy.id}/publish`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(publishResponse.status).toBe(200);

    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;

    const conversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_course_level_policy"
      });

    expect(conversationResponse.status).toBe(201);

    const turnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "Please give me the direct answer",
        courseId: "crs_math_1550",
        assignmentId: "asg_course_level_policy",
        selectedChip: null
      });

    expect(turnResponse.status).toBe(201);
    expect(turnResponse.body.turn.validation.status).toBe("modified");
    expect(turnResponse.body.turn.validation.reason).toContain("Course Wide Direct Answer Guardrails");

    const flagged = await findFlaggedTurnByTurnId(turnResponse.body.turn.id as string);
    expect(flagged?.policyId).toBe(policyResponse.body.policy.id);
  });

  it("blocks turns when a published policy clause requires blocking", async () => {
    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const policyResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_block",
        title: "Reflection Integrity Guardrails",
        clauses: [
          {
            rule: "Do not write reflections on behalf of learners",
            when: "student asks to write reflection text",
            onViolation: "block"
          }
        ]
      });

    expect(policyResponse.status).toBe(201);

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${policyResponse.body.policy.id}/publish`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(publishResponse.status).toBe(200);

    const studentLogin = await loginAs("maya@example.edu");
    const conversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_block"
      });

    const turnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`)
      .send({
        message: "Please write my reflection text for me",
        courseId: "crs_math_1550",
        assignmentId: "asg_policy_block",
        selectedChip: null
      });

    expect(turnResponse.status).toBe(201);
    expect(turnResponse.body.turn.validation.status).toBe("blocked");

    const flagged = await findFlaggedTurnByTurnId(turnResponse.body.turn.id as string);
    expect(flagged?.status).toBe("pending");
  });


  it("supports faculty flagged review queue, detail, and decision workflow", async () => {
    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const policyResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        courseId: "crs_math_1550",
        assignmentId: "asg_review_queue",
        title: "Review Queue Guardrails",
        clauses: [
          {
            rule: "Guide with analogous examples instead of final answers",
            when: "student asks for direct answer",
            onViolation: "modify"
          }
        ]
      });

    expect(policyResponse.status).toBe(201);

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${policyResponse.body.policy.id}/publish`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(publishResponse.status).toBe(200);

    const studentLogin = await loginAs("maya@example.edu");
    const studentToken = studentLogin.body.accessToken;
    const conversationResponse = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        learnerId: "usr_student_1",
        courseId: "crs_math_1550",
        assignmentId: "asg_review_queue"
      });

    const turnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "Please give me the direct answer",
        courseId: "crs_math_1550",
        assignmentId: "asg_review_queue",
        selectedChip: null
      });

    expect(turnResponse.status).toBe(201);
    const flagged = await findFlaggedTurnByTurnId(turnResponse.body.turn.id as string);
    expect(flagged?.status).toBe("pending");

    const secondTurnResponse = await request(app)
      .post(`/api/v1/conversations/${conversationResponse.body.conversation.id}/turns`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({
        message: "I still need the direct answer",
        courseId: "crs_math_1550",
        assignmentId: "asg_review_queue",
        selectedChip: null
      });

    expect(secondTurnResponse.status).toBe(201);
    const secondFlagged = await findFlaggedTurnByTurnId(secondTurnResponse.body.turn.id as string);
    expect(secondFlagged?.status).toBe("pending");

    const listResponse = await request(app)
      .get("/api/v1/reviews/flagged?courseId=crs_math_1550&status=pending")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.flagged.some((item: { id: string }) => item.id === flagged?.id)).toBe(true);
    expect(listResponse.body.page.limit).toBe(50);

    const firstPageResponse = await request(app)
      .get("/api/v1/reviews/flagged?courseId=crs_math_1550&status=pending&limit=1")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(firstPageResponse.status).toBe(200);
    expect(firstPageResponse.body.flagged).toHaveLength(1);
    expect(firstPageResponse.body.page.nextCursor).toBeTypeOf("string");

    const secondPageResponse = await request(app)
      .get(`/api/v1/reviews/flagged?courseId=crs_math_1550&status=pending&limit=1&cursor=${firstPageResponse.body.page.nextCursor}`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(secondPageResponse.status).toBe(200);
    expect(secondPageResponse.body.flagged).toHaveLength(1);
    expect(secondPageResponse.body.flagged[0].id).not.toBe(firstPageResponse.body.flagged[0].id);

    const detailResponse = await request(app)
      .get(`/api/v1/reviews/flagged/${flagged?.id}`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.flaggedTurn.id).toBe(flagged?.id);
    expect(detailResponse.body.flaggedTurn.decisions).toHaveLength(0);

    const decisionResponse = await request(app)
      .post(`/api/v1/reviews/flagged/${flagged?.id}/decision`)
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({ decision: "override", note: "Allowed because this was non-graded practice." });

    expect(decisionResponse.status).toBe(201);
    expect(decisionResponse.body.decision.reviewerId).toBe("usr_faculty_1");
    expect(decisionResponse.body.decision.policyId).toBe(flagged?.policyId);
    expect(decisionResponse.body.decision.clauseId).toBe(flagged?.clauseId);

    const adminLogin = await loginAs("admin@example.edu");
    const auditResponse = await request(app)
      .get("/api/v1/admin/audit-logs?action=review.decision.create")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.logs.some((log: { targetId: string | null }) => log.targetId === decisionResponse.body.decision.id)).toBe(true);

    const resolvedResponse = await request(app)
      .get("/api/v1/reviews/flagged?courseId=crs_math_1550&status=resolved")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(resolvedResponse.status).toBe(200);
    expect(resolvedResponse.body.flagged.some((item: { id: string }) => item.id === flagged?.id)).toBe(true);

    const reviewedDetail = await request(app)
      .get(`/api/v1/reviews/flagged/${flagged?.id}`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(reviewedDetail.status).toBe(200);
    expect(reviewedDetail.body.flaggedTurn.status).toBe("resolved");
    expect(reviewedDetail.body.flaggedTurn.decisions).toHaveLength(1);

    const duplicateDecisionResponse = await request(app)
      .post(`/api/v1/reviews/flagged/${flagged?.id}/decision`)
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({ decision: "approve", note: "Second decision should not be accepted." });

    expect(duplicateDecisionResponse.status).toBe(409);
    expect(duplicateDecisionResponse.body.error.code).toBe("FLAGGED_TURN_ALREADY_RESOLVED");

    const duplicateCheckDetail = await request(app)
      .get(`/api/v1/reviews/flagged/${flagged?.id}`)
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(duplicateCheckDetail.status).toBe(200);
    expect(duplicateCheckDetail.body.flaggedTurn.decisions).toHaveLength(1);
  });

  it("denies flagged review endpoints for student role", async () => {
    const studentLogin = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/reviews/flagged")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("returns validation error for malformed conversation payload", async () => {
    const loginResponse = await loginAs("maya@example.edu");
    const token = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/api/v1/conversations")
      .set("Authorization", `Bearer ${token}`)
      .send({ learnerId: "", courseId: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("allows faculty to create, update, publish, list, and archive course policies", async () => {
    const loginResponse = await loginAs("carter@example.edu");
    const token = loginResponse.body.accessToken;

    const createResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        courseId: "crs_math_1550",
        assignmentId: "asg_chain_rule_policy",
        title: "Chain Rule Homework Guardrails",
        clauses: [
          {
            rule: "Do not provide final answers to graded problems",
            when: "student asks for direct answer",
            onViolation: "modify"
          }
        ]
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.policy.status).toBe("draft");
    expect(createResponse.body.policy.clauses).toHaveLength(1);
    const policyId = createResponse.body.policy.id as string;

    const updateResponse = await request(app)
      .put(`/api/v1/policies/${policyId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Chain Rule Guardrails",
        clauses: [
          {
            rule: "Guide with analogous examples instead of final answers",
            when: "student asks for direct answer",
            onViolation: "modify"
          },
          {
            rule: "Block ghostwritten reflections",
            when: "student asks the assistant to write reflection text",
            onViolation: "block"
          }
        ]
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.policy.clauses).toHaveLength(2);

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${policyId}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.policy.status).toBe("published");
    expect(publishResponse.body.policy.publishedAt).toBeTypeOf("string");

    const adminLogin = await loginAs("admin@example.edu");
    const auditResponse = await request(app)
      .get("/api/v1/admin/audit-logs?action=policy.publish")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.logs.some((log: { targetId: string | null }) => log.targetId === policyId)).toBe(true);

    const listResponse = await request(app)
      .get("/api/v1/policies?courseId=crs_math_1550")
      .set("Authorization", `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.policies.some((policy: { id: string }) => policy.id === policyId)).toBe(true);

    const archiveResponse = await request(app)
      .delete(`/api/v1/policies/${policyId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(archiveResponse.status).toBe(204);
  });

  it("rejects publishing an empty policy", async () => {
    const loginResponse = await loginAs("carter@example.edu");
    const token = loginResponse.body.accessToken;

    const createResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${token}`)
      .send({
        courseId: "crs_math_1550",
        title: "Empty Draft",
        clauses: []
      });

    expect(createResponse.status).toBe(201);

    const publishResponse = await request(app)
      .post(`/api/v1/policies/${createResponse.body.policy.id}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(publishResponse.status).toBe(422);
    expect(publishResponse.body.error.code).toBe("POLICY_EMPTY");
  });

  it("enforces faculty course scope for policy management", async () => {
    const adminLogin = await loginAs("admin@example.edu");
    const adminToken = adminLogin.body.accessToken;

    const histPolicyResponse = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        courseId: "crs_hist_2000",
        title: "History Course Guardrails",
        clauses: [
          {
            rule: "Ask learners to cite primary sources",
            when: "student asks for essay support",
            onViolation: "flag"
          }
        ]
      });

    expect(histPolicyResponse.status).toBe(201);

    const facultyLogin = await loginAs("carter@example.edu");
    const facultyToken = facultyLogin.body.accessToken;

    const forbiddenCreate = await request(app)
      .post("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`)
      .send({
        courseId: "crs_hist_2000",
        title: "Out of Scope Guardrails",
        clauses: []
      });

    expect(forbiddenCreate.status).toBe(403);
    expect(forbiddenCreate.body.error.code).toBe("POLICY_FORBIDDEN");

    const forbiddenList = await request(app)
      .get("/api/v1/policies?courseId=crs_hist_2000")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(forbiddenList.status).toBe(403);
    expect(forbiddenList.body.error.code).toBe("POLICY_FORBIDDEN");

    const scopedList = await request(app)
      .get("/api/v1/policies")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(scopedList.status).toBe(200);
    expect(scopedList.body.policies.some((policy: { id: string }) => policy.id === histPolicyResponse.body.policy.id)).toBe(false);
  });

  it("denies policy endpoints for student role", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/policies")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("supports admin KPI, integration, and audit log APIs", async () => {
    const loginResponse = await loginAs("admin@example.edu");
    const token = loginResponse.body.accessToken;

    const kpisResponse = await request(app)
      .get("/api/v1/admin/kpis")
      .set("Authorization", `Bearer ${token}`);

    expect(kpisResponse.status).toBe(200);
    expect(kpisResponse.body.kpis.users.total).toBe(6);
    expect(kpisResponse.body.kpis.courses.total).toBe(3);

    const integrationsResponse = await request(app)
      .get("/api/v1/admin/integrations")
      .set("Authorization", `Bearer ${token}`);

    expect(integrationsResponse.status).toBe(200);
    expect(integrationsResponse.body.integrations.length).toBeGreaterThan(0);

    const updateIntegrationResponse = await request(app)
      .put("/api/v1/admin/integrations/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "connected",
        details: "Webhook latency back within target"
      });

    expect(updateIntegrationResponse.status).toBe(200);
    expect(updateIntegrationResponse.body.integration.status).toBe("connected");

    const auditResponse = await request(app)
      .get("/api/v1/admin/audit-logs?action=integration.update")
      .set("Authorization", `Bearer ${token}`);

    expect(auditResponse.status).toBe(200);
    expect(auditResponse.body.logs.some((log: { targetId: string | null }) => log.targetId === "chat")).toBe(true);
    expect(auditResponse.body.page.limit).toBe(50);
  });

  it("exposes Prometheus metrics to admin users only", async () => {
    const healthResponse = await request(app).get("/api/v1/health");
    expect(healthResponse.status).toBe(200);

    const studentLogin = await loginAs("maya@example.edu");
    const deniedResponse = await request(app)
      .get("/api/v1/admin/metrics")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`);

    expect(deniedResponse.status).toBe(403);

    const adminLogin = await loginAs("admin@example.edu");
    const response = await request(app)
      .get("/api/v1/admin/metrics")
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("educlaw_process_uptime_seconds");
    expect(response.text).toContain('educlaw_http_requests_total{method="GET",route="/api/v1/health",status_class="2xx"} 1');
  });

  it("denies admin APIs for non-admin roles", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/admin/kpis")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("supports FERPA scope explorer for auditor and admin roles", async () => {
    const auditorLogin = await loginAs("auditor@example.edu");

    const response = await request(app)
      .get("/api/v1/audit/ferpa-scope?learnerId=usr_student_1&scope=advisor_visibility&enabled=false")
      .set("Authorization", `Bearer ${auditorLogin.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.records).toHaveLength(1);
    expect(response.body.records[0].learnerId).toBe("usr_student_1");
    expect(response.body.records[0].scopes.find((scope: { key: string; enabled: boolean }) => scope.key === "advisor_visibility")?.enabled).toBe(false);
    expect(response.body.records[0].latestEvent.actorUserId).toBe("usr_student_1");
    expect(response.body.page.limit).toBe(50);

    const firstPage = await request(app)
      .get("/api/v1/audit/ferpa-scope?limit=1")
      .set("Authorization", `Bearer ${auditorLogin.body.accessToken}`);

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.records).toHaveLength(1);
    expect(firstPage.body.page.nextCursor).toBeTypeOf("string");

    const secondPage = await request(app)
      .get(`/api/v1/audit/ferpa-scope?limit=1&cursor=${firstPage.body.page.nextCursor}`)
      .set("Authorization", `Bearer ${auditorLogin.body.accessToken}`);

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.records).toHaveLength(1);
    expect(secondPage.body.records[0].learnerId).not.toBe(firstPage.body.records[0].learnerId);

    const studentLogin = await loginAs("maya@example.edu");
    const deniedResponse = await request(app)
      .get("/api/v1/audit/ferpa-scope")
      .set("Authorization", `Bearer ${studentLogin.body.accessToken}`);

    expect(deniedResponse.status).toBe(403);
    expect(deniedResponse.body.error.code).toBe("AUTH_FORBIDDEN");
  });
});

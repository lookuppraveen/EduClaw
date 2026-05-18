import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";
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

  it("returns forbidden for non-enrolled existing course", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/courses/crs_hist_2000")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("COURSE_FORBIDDEN");
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

    const listResponse = await request(app)
      .get("/api/v1/reviews/flagged?courseId=crs_math_1550&status=pending")
      .set("Authorization", `Bearer ${facultyToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.flagged.some((item: { id: string }) => item.id === flagged?.id)).toBe(true);

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

  it("denies policy endpoints for student role", async () => {
    const loginResponse = await loginAs("maya@example.edu");

    const response = await request(app)
      .get("/api/v1/policies")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });
});

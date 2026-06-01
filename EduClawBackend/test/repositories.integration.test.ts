import { describe, expect, it } from "vitest";
import { prisma } from "../src/db/prisma.js";
import { findUserByEmail } from "../src/repositories/prisma/user.repository.js";
import { getSession, isRefreshTokenValid, saveSession } from "../src/repositories/prisma/session.repository.js";
import { findCourseById, sharesCourseWithLearner } from "../src/repositories/prisma/course.repository.js";
import {
  createReflectionEntry,
  findLearnerState,
  replaceLearnerGoals,
  updateMasteryFromCompletedTurn
} from "../src/repositories/prisma/learner-state.repository.js";
import { getConsentRecord, updateConsentRecord } from "../src/repositories/prisma/consent.repository.js";
import { createAuditLog, verifyAuditLogIntegrity } from "../src/repositories/prisma/admin.repository.js";
import { newId, sha256 } from "../src/common/crypto.js";
import { PrismaConversationRepository } from "../src/modules/conversations/repositories/prisma-conversation.repository.js";

describe("Prisma repositories", () => {
  it("reads seeded user by email", async () => {
    const user = await findUserByEmail("maya@example.edu");
    expect(user?.id).toBe("usr_student_1");
  });

  it("persists and validates refresh sessions", async () => {
    const token = "refresh-token-example";
    const id = newId();
    const now = Date.now();

    await saveSession({
      id,
      userId: "usr_student_1",
      refreshTokenHash: sha256(token),
      createdAt: now,
      expiresAt: now + 1000 * 60
    });

    const stored = await getSession(id);
    expect(stored?.userId).toBe("usr_student_1");

    const valid = await isRefreshTokenValid(id, token);
    expect(valid).toBe(true);
  });

  it("loads course and shared enrollment context", async () => {
    const course = await findCourseById("crs_math_1550");
    expect(course?.code).toBe("MATH 1550");

    const shared = await sharesCourseWithLearner("usr_faculty_1", "usr_student_1");
    expect(shared).toBe(true);
  });

  it("loads learner state aggregates", async () => {
    const state = await findLearnerState("usr_student_1");
    expect(state?.goals.length).toBeGreaterThan(0);
    expect(state?.mastery.length).toBeGreaterThan(0);
  });

  it("encrypts learner goals and reflections at rest while returning plaintext", async () => {
    const goalText = "Keep my calculus confidence notes private";
    const reflectionPrompt = "What felt hardest today?";
    const reflectionResponse = "I mixed up the inner and outer functions.";

    const goals = await replaceLearnerGoals("usr_student_1", [{ text: goalText }]);
    const reflection = await createReflectionEntry("usr_student_1", {
      prompt: reflectionPrompt,
      response: reflectionResponse,
      kind: "metacognitive"
    });

    expect(goals[0]?.text).toBe(goalText);
    expect(reflection.prompt).toBe(reflectionPrompt);
    expect(reflection.response).toBe(reflectionResponse);

    const rawGoal = await prisma.learnerGoal.findUniqueOrThrow({ where: { id: goals[0]?.id } });
    const rawReflection = await prisma.reflectionEntry.findUniqueOrThrow({ where: { id: reflection.id } });

    expect(rawGoal.text).not.toBe(goalText);
    expect(rawGoal.text).toMatch(/^enc:v1:/);
    expect(rawReflection.prompt).not.toBe(reflectionPrompt);
    expect(rawReflection.prompt).toMatch(/^enc:v1:/);
    expect(rawReflection.response).not.toBe(reflectionResponse);
    expect(rawReflection.response).toMatch(/^enc:v1:/);

    const state = await findLearnerState("usr_student_1");
    expect(state?.goals.find((item) => item.id === goals[0]?.id)?.text).toBe(goalText);
    expect(state?.reflections.find((item) => item.id === reflection.id)?.prompt).toBe(reflectionPrompt);
    expect(state?.reflections.find((item) => item.id === reflection.id)?.response).toBe(reflectionResponse);
  });

  it("encrypts conversation turn and trace text at rest while returning plaintext", async () => {
    const repository = new PrismaConversationRepository();
    const conversationId = newId();
    const turnId = newId();
    const traceId = newId();
    const now = new Date().toISOString();

    await repository.createConversation({
      id: conversationId,
      learnerId: "usr_student_1",
      courseId: "crs_math_1550",
      assignmentId: "asg_encryption",
      createdAt: now,
      updatedAt: now
    });

    const savedTurn = await repository.saveTurn({
      id: turnId,
      conversationId,
      learnerId: "usr_student_1",
      courseId: "crs_math_1550",
      assignmentId: "asg_encryption",
      studentInput: "Can you explain my exact homework answer?",
      selectedChip: "Derivative order",
      inference: {
        intent: "seeking direct answer",
        confusionLevel: "medium",
        knowledgeGap: "chain rule setup",
        urgency: "medium",
        confidence: 0.82,
        rationale: "Student asks for exact homework help",
        recommendedNextAgent: "dialogue"
      },
      dialogue: {
        question: "Which chain rule step is unclear?",
        chips: ["outer function", "inner function"]
      },
      execution: {
        scaffold: "Try identifying the inner function first.",
        workedExamples: ["For f(g(x)), start with the outside derivative."],
        citations: [{ source: "Stewart Ch.3", url: "https://example.edu/stewart" }],
        suggestedAction: "Ask a clarifying question"
      },
      validation: {
        status: "modified",
        reason: "No final answers for graded work",
        studentFacingMessage: "I can guide you through a similar setup.",
        policyClause: "Do not provide final answers"
      },
      reflection: {
        prompt: "How would you identify inner and outer functions next time?",
        kind: "metacognitive",
        optional: true
      },
      createdAt: now
    }, [{
      id: traceId,
      turnId,
      agent: "dialogue",
      startedAt: now,
      durationMs: 12,
      confidence: 0.84,
      outputSummary: "Asked a clarifying question about chain rule steps",
      internalDetails: "Selected dialogue path because policy discouraged final-answer help"
    }]);

    expect(savedTurn.studentInput).toBe("Can you explain my exact homework answer?");
    expect(savedTurn.execution.scaffold).toBe("Try identifying the inner function first.");
    expect(savedTurn.reflection.prompt).toBe("How would you identify inner and outer functions next time?");

    const rawTurn = await prisma.conversationTurn.findUniqueOrThrow({ where: { id: turnId } });
    const rawTrace = await prisma.agentTrace.findUniqueOrThrow({ where: { id: traceId } });

    expect(rawTurn.studentInput).toMatch(/^enc:v1:/);
    expect(rawTurn.studentInput).not.toBe(savedTurn.studentInput);
    expect(rawTurn.executionScaffold).toMatch(/^enc:v1:/);
    expect(rawTurn.dialogueChips.every((chip) => chip.startsWith("enc:v1:"))).toBe(true);
    expect(rawTurn.reflectionPrompt).toMatch(/^enc:v1:/);
    expect(rawTrace.outputSummary).toMatch(/^enc:v1:/);
    expect(rawTrace.internalDetails).toMatch(/^enc:v1:/);

    const loadedTurn = await repository.getTurnById(turnId);
    const loadedTrace = await repository.getTurnTrace(turnId);

    expect(loadedTurn?.studentInput).toBe(savedTurn.studentInput);
    expect(loadedTurn?.dialogue.chips).toEqual(["outer function", "inner function"]);
    expect(loadedTurn?.validation.studentFacingMessage).toBe("I can guide you through a similar setup.");
    expect(loadedTrace[0]?.outputSummary).toBe("Asked a clarifying question about chain rule steps");
    expect(loadedTrace[0]?.internalDetails).toBe("Selected dialogue path because policy discouraged final-answer help");
  });

  it("enforces core schema uniqueness for course and outcome identity", async () => {
    await expect(prisma.course.create({
      data: {
        id: "crs_duplicate_math",
        code: "MATH 1550",
        title: "Duplicate Calculus",
        term: "Fall 2026"
      }
    })).rejects.toMatchObject({ code: "P2002" });

    await expect(prisma.outcome.create({
      data: {
        id: "out_duplicate_chain_rule",
        courseId: "crs_math_1550",
        code: "MATH-CR-1",
        description: "Duplicate chain rule outcome"
      }
    })).rejects.toMatchObject({ code: "P2002" });
  });

  it("updates learner mastery atomically without duplicate learner-outcome rows", async () => {
    const first = await updateMasteryFromCompletedTurn({
      learnerId: "usr_student_1",
      courseId: "crs_math_1550",
      turnId: "turn_integrity_1",
      knowledgeGap: "chain rule composition",
      confidence: 0.8,
      validationStatus: "approved"
    });
    const second = await updateMasteryFromCompletedTurn({
      learnerId: "usr_student_1",
      courseId: "crs_math_1550",
      turnId: "turn_integrity_2",
      knowledgeGap: "chain rule composition",
      confidence: 0.9,
      validationStatus: "modified"
    });

    expect(first?.outcomeId).toBe("out_math_chain_rule");
    expect(second?.outcomeId).toBe("out_math_chain_rule");

    const rows = await prisma.learnerMastery.findMany({
      where: {
        learnerId: "usr_student_1",
        outcomeId: "out_math_chain_rule"
      }
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.evidence).toBe("Conversation turn turn_integrity_2");
  });

  it("updates consent and appends history atomically", async () => {
    const updated = await updateConsentRecord(
      "usr_student_1",
      "usr_student_1",
      [
        { key: "course_context", enabled: true },
        { key: "prior_conversations", enabled: true },
        { key: "advisor_visibility", enabled: true },
        { key: "third_party_tools", enabled: false }
      ],
      "integration-test"
    );

    expect(updated.scopes.find((item) => item.key === "advisor_visibility")?.enabled).toBe(true);

    const consent = await getConsentRecord("usr_student_1");
    expect(consent?.scopes.find((item) => item.key === "advisor_visibility")?.enabled).toBe(true);
  });

  it("stores audit logs in a tamper-evident hash chain", async () => {
    const first = await createAuditLog({
      actorUserId: "usr_admin_1",
      action: "security.audit.first",
      targetType: "audit_log",
      targetId: "first",
      metadata: { severity: "info", sequence: 1 }
    });
    const second = await createAuditLog({
      actorUserId: "usr_admin_1",
      action: "security.audit.second",
      targetType: "audit_log",
      targetId: "second",
      metadata: { severity: "info", sequence: 2 }
    });

    const firstRow = await prisma.auditLog.findUniqueOrThrow({ where: { id: first.id } });
    const secondRow = await prisma.auditLog.findUniqueOrThrow({ where: { id: second.id } });
    expect(firstRow.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(secondRow.previousHash).toBe(firstRow.hash);
    await expect(verifyAuditLogIntegrity()).resolves.toEqual({ valid: true, brokenAt: null });

    await prisma.auditLog.update({
      where: { id: first.id },
      data: { metadata: { severity: "critical", sequence: 1 } }
    });

    await expect(verifyAuditLogIntegrity()).resolves.toEqual({ valid: false, brokenAt: first.id });
  });
});

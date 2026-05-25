import { describe, expect, it } from "vitest";
import { prisma } from "../src/db/prisma.js";
import { findUserByEmail } from "../src/repositories/prisma/user.repository.js";
import { getSession, isRefreshTokenValid, saveSession } from "../src/repositories/prisma/session.repository.js";
import { findCourseById, sharesCourseWithLearner } from "../src/repositories/prisma/course.repository.js";
import { findLearnerState, updateMasteryFromCompletedTurn } from "../src/repositories/prisma/learner-state.repository.js";
import { getConsentRecord, updateConsentRecord } from "../src/repositories/prisma/consent.repository.js";
import { newId, sha256 } from "../src/common/crypto.js";

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
});

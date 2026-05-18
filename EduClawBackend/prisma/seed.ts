import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();

export const seedDatabase = async (client: PrismaClient): Promise<void> => {
  await client.agentTrace.deleteMany();
  await client.conversationTurn.deleteMany();
  await client.conversation.deleteMany();
  await client.policyClause.deleteMany();
  await client.validationPolicy.deleteMany();
  await client.consentHistory.deleteMany();
  await client.consent.deleteMany();
  await client.learnerMastery.deleteMany();
  await client.learnerGoal.deleteMany();
  await client.reflectionEntry.deleteMany();
  await client.learnerState.deleteMany();
  await client.session.deleteMany();
  await client.enrollment.deleteMany();
  await client.material.deleteMany();
  await client.outcome.deleteMany();
  await client.course.deleteMany();
  await client.user.deleteMany();

  await client.user.createMany({
    data: [
      { id: "usr_student_1", name: "Maya Chen", email: "maya@example.edu", role: "student" },
      { id: "usr_faculty_1", name: "Prof. Carter", email: "carter@example.edu", role: "faculty" },
      { id: "usr_admin_1", name: "Admin Jane", email: "admin@example.edu", role: "admin" },
      { id: "usr_advisor_1", name: "Advisor Lee", email: "advisor@example.edu", role: "advisor" },
      { id: "usr_auditor_1", name: "Auditor Kim", email: "auditor@example.edu", role: "auditor" }
    ]
  });

  await client.course.createMany({
    data: [
      { id: "crs_math_1550", code: "MATH 1550", title: "Calculus I", term: "Fall 2026" },
      { id: "crs_eng_1010", code: "ENG 1010", title: "Composition I", term: "Fall 2026" },
      { id: "crs_hist_2000", code: "HIST 2000", title: "World History", term: "Fall 2026" }
    ]
  });

  await client.outcome.createMany({
    data: [
      { id: "out_math_chain_rule", courseId: "crs_math_1550", code: "MATH-CR-1", description: "Apply the chain rule to composite functions" },
      { id: "out_math_product_rule", courseId: "crs_math_1550", code: "MATH-PR-1", description: "Differentiate functions using the product rule" },
      { id: "out_eng_thesis", courseId: "crs_eng_1010", code: "ENG-TH-1", description: "Develop a clear argumentative thesis" },
      { id: "out_hist_context", courseId: "crs_hist_2000", code: "HIST-CTX-1", description: "Analyze historical context across periods" }
    ]
  });

  await client.material.createMany({
    data: [
      { id: "mat_calc_textbook_ch3", courseId: "crs_math_1550", title: "Stewart Calculus Chapter 3", type: "textbook", url: "https://example.edu/materials/stewart-ch3" },
      { id: "mat_calc_lecture_5", courseId: "crs_math_1550", title: "Lecture 5: Chain Rule", type: "lecture", url: "https://example.edu/materials/lecture-5" },
      { id: "mat_eng_rubric", courseId: "crs_eng_1010", title: "Argumentative Essay Rubric", type: "worksheet", url: "https://example.edu/materials/essay-rubric" },
      { id: "mat_hist_reader", courseId: "crs_hist_2000", title: "Primary Sources Reader", type: "textbook", url: "https://example.edu/materials/history-reader" }
    ]
  });

  await client.enrollment.createMany({
    data: [
      { userId: "usr_student_1", courseId: "crs_math_1550", role: "student" },
      { userId: "usr_student_1", courseId: "crs_eng_1010", role: "student" },
      { userId: "usr_faculty_1", courseId: "crs_math_1550", role: "faculty" },
      { userId: "usr_faculty_1", courseId: "crs_eng_1010", role: "faculty" },
      { userId: "usr_admin_1", courseId: "crs_math_1550", role: "advisor" },
      { userId: "usr_advisor_1", courseId: "crs_math_1550", role: "advisor" }
    ]
  });

  await client.learnerState.create({ data: { learnerId: "usr_student_1" } });

  await client.learnerGoal.create({
    data: {
      id: "goal_1",
      learnerId: "usr_student_1",
      text: "Understand chain rule for this week's homework",
      createdAt: new Date("2026-05-01T10:00:00.000Z")
    }
  });

  await client.learnerMastery.create({
    data: {
      id: "mastery_1",
      learnerId: "usr_student_1",
      outcomeId: "out_math_chain_rule",
      score: 0.62,
      evidence: "Homework 4",
      updatedAt: new Date("2026-05-10T10:00:00.000Z")
    }
  });

  await client.reflectionEntry.create({
    data: {
      id: "refl_1",
      learnerId: "usr_student_1",
      prompt: "How would you explain chain rule in one sentence?",
      response: "Differentiate outer, keep inner, then multiply by derivative of inner.",
      kind: "metacognitive",
      createdAt: new Date("2026-05-11T10:00:00.000Z")
    }
  });

  await client.consent.create({
    data: {
      learnerId: "usr_student_1",
      courseContext: true,
      priorConversations: true,
      advisorVisibility: false,
      thirdPartyTools: false,
      updatedAt: new Date("2026-05-10T09:00:00.000Z")
    }
  });

  await client.validationPolicy.create({
    data: {
      id: "pol_math_hw_guardrails",
      courseId: "crs_math_1550",
      assignmentId: "asg_chain_rule_seed",
      title: "MATH 1550 Chain Rule Guardrails",
      status: "published",
      publishedAt: new Date("2026-05-12T10:00:00.000Z"),
      createdById: "usr_faculty_1",
      updatedById: "usr_faculty_1",
      clauses: {
        create: [
          {
            id: "clause_no_final_answer",
            rule: "Do not provide final answers to graded chain rule problems",
            when: "student requests a direct final answer",
            onViolation: "modify"
          },
          {
            id: "clause_reflection_integrity",
            rule: "Do not write reflections on behalf of learners",
            when: "student asks for a completed reflection response",
            onViolation: "block"
          }
        ]
      }
    }
  });
};

const runCli = async (): Promise<void> => {
  await seedDatabase(prisma);
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli()
    .catch(async (error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

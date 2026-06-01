import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { p95, TURN_PIPELINE_P95_TARGET_MS } from "../src/common/sla.js";
import { MockOrchestratorService } from "../src/modules/conversations/services/mock-orchestrator.service.js";
import { PolicyEvaluatorService } from "../src/modules/policies/services/policy-evaluator.service.js";
import type { ValidationPolicy } from "../src/types/policies.js";

const samplePolicy: ValidationPolicy = {
  id: "pol_perf_guardrails",
  courseId: "crs_math_1550",
  assignmentId: "asg_perf",
  title: "Performance Guardrails",
  status: "published",
  publishedAt: "2026-05-12T10:00:00.000Z",
  createdById: "usr_faculty_1",
  updatedById: "usr_faculty_1",
  createdAt: "2026-05-12T10:00:00.000Z",
  updatedAt: "2026-05-12T10:00:00.000Z",
  clauses: [
    {
      id: "clause_perf_no_final_answer",
      rule: "Do not provide final answers to graded chain rule problems",
      when: "student requests a direct final answer",
      onViolation: "modify",
      createdAt: "2026-05-12T10:00:00.000Z",
      updatedAt: "2026-05-12T10:00:00.000Z"
    }
  ]
};

describe("turn pipeline performance SLA", () => {
  it("calculates p95 from observed durations", () => {
    expect(p95([1, 2, 3, 4, 100])).toBe(100);
    expect(p95([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])).toBe(100);
  });

  it("keeps the mock orchestrator and policy evaluation p95 under target excluding LLM latency", () => {
    const orchestrator = new MockOrchestratorService();
    const evaluator = new PolicyEvaluatorService();
    const durations: number[] = [];

    for (let index = 0; index < 100; index += 1) {
      const message = index % 2 === 0
        ? "Please give me the direct final answer"
        : "Can you help me understand the chain rule setup?";
      const startedAt = performance.now();
      const orchestrated = orchestrator.run({ message, selectedChip: null });
      evaluator.evaluate(
        {
          studentInput: message,
          selectedChip: null,
          courseId: "crs_math_1550",
          assignmentId: "asg_perf",
          inference: orchestrated.inference,
          execution: orchestrated.execution
        },
        [samplePolicy],
        orchestrated.validation
      );
      durations.push(performance.now() - startedAt);
    }

    expect(p95(durations)).toBeLessThan(TURN_PIPELINE_P95_TARGET_MS);
  });
});

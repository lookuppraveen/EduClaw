import type { ValidationPolicy } from "../types";

export const samplePolicy: ValidationPolicy = {
  id: "pol_calc_hw5",
  courseId: "c_calc1",
  assignmentId: "a_hw5",
  title: "MATH 1550 — Homework 5: Chain Rule",
  authoredBy: "Dr. Aisha Patel",
  updatedAt: "2026-05-01T13:00:00Z",
  clauses: [
    {
      id: "cl_1",
      rule: "Do not provide the final numerical answer to any graded homework problem.",
      whenToApply: "Student references a problem number on the active assignment.",
      onViolation: "modify",
    },
    {
      id: "cl_2",
      rule: "Always cite the textbook or lecture source when explaining a method.",
      whenToApply: "Any explanation of a derivative rule.",
      onViolation: "modify",
    },
    {
      id: "cl_3",
      rule: "Block any request to write the student's reflection or self-assessment.",
      whenToApply: "Student asks the agent to produce reflective writing on their behalf.",
      onViolation: "block",
    },
  ],
};

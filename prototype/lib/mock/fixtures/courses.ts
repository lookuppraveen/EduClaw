import type { Course } from "../types";

export const courses: Course[] = [
  {
    id: "c_calc1",
    code: "MATH 1550",
    title: "Calculus I",
    term: "Spring 2026",
    enrollmentCount: 187,
    outcomes: [
      { id: "o_chain", label: "Apply the chain rule to composite functions" },
      { id: "o_limits", label: "Evaluate limits using algebraic manipulation" },
      { id: "o_deriv", label: "Compute derivatives of polynomial and trig functions" },
      { id: "o_optim", label: "Solve optimization problems with derivatives" },
    ],
  },
  {
    id: "c_comp1",
    code: "ENGL 1010",
    title: "Composition I",
    term: "Spring 2026",
    enrollmentCount: 142,
    outcomes: [
      { id: "o_thesis", label: "Construct a defensible thesis" },
      { id: "o_evidence", label: "Integrate evidence with attribution" },
      { id: "o_revise", label: "Revise structure across drafts" },
    ],
  },
  {
    id: "c_nurs",
    code: "NURS 2100",
    title: "Foundations of Nursing Practice",
    term: "Spring 2026",
    enrollmentCount: 64,
    outcomes: [
      { id: "o_assess", label: "Conduct a head-to-toe patient assessment" },
      { id: "o_safety", label: "Apply medication safety protocols" },
      { id: "o_doc", label: "Document care using SBAR format" },
    ],
  },
];

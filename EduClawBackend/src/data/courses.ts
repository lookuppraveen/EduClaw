import type { Course } from "../types/courses.js";

export const courses: Course[] = [
  {
    id: "crs_math_1550",
    code: "MATH 1550",
    title: "Calculus I",
    term: "Fall 2026",
    facultyIds: ["usr_faculty_1"],
    outcomes: [
      {
        id: "out_math_chain_rule",
        code: "MATH-CR-1",
        description: "Apply the chain rule to composite functions"
      },
      {
        id: "out_math_product_rule",
        code: "MATH-PR-1",
        description: "Differentiate functions using the product rule"
      }
    ],
    materials: [
      {
        id: "mat_calc_textbook_ch3",
        title: "Stewart Calculus Chapter 3",
        type: "textbook",
        url: "https://example.edu/materials/stewart-ch3"
      },
      {
        id: "mat_calc_lecture_5",
        title: "Lecture 5: Chain Rule",
        type: "lecture",
        url: "https://example.edu/materials/lecture-5"
      }
    ]
  },
  {
    id: "crs_eng_1010",
    code: "ENG 1010",
    title: "Composition I",
    term: "Fall 2026",
    facultyIds: ["usr_faculty_1"],
    outcomes: [
      {
        id: "out_eng_thesis",
        code: "ENG-TH-1",
        description: "Develop a clear argumentative thesis"
      }
    ],
    materials: [
      {
        id: "mat_eng_rubric",
        title: "Argumentative Essay Rubric",
        type: "worksheet",
        url: "https://example.edu/materials/essay-rubric"
      }
    ]
  },
  {
    id: "crs_hist_2000",
    code: "HIST 2000",
    title: "World History",
    term: "Fall 2026",
    facultyIds: ["usr_faculty_1"],
    outcomes: [
      {
        id: "out_hist_context",
        code: "HIST-CTX-1",
        description: "Analyze historical context across periods"
      }
    ],
    materials: [
      {
        id: "mat_hist_reader",
        title: "Primary Sources Reader",
        type: "textbook",
        url: "https://example.edu/materials/history-reader"
      }
    ]
  }
];
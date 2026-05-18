import type { CourseEnrollment } from "../types/courses.js";

export const enrollments: CourseEnrollment[] = [
  {
    userId: "usr_student_1",
    courseId: "crs_math_1550",
    role: "student"
  },
  {
    userId: "usr_student_1",
    courseId: "crs_eng_1010",
    role: "student"
  },
  {
    userId: "usr_faculty_1",
    courseId: "crs_math_1550",
    role: "faculty"
  },
  {
    userId: "usr_faculty_1",
    courseId: "crs_eng_1010",
    role: "faculty"
  },
  {
    userId: "usr_admin_1",
    courseId: "crs_math_1550",
    role: "advisor"
  },
  {
    userId: "usr_advisor_1",
    courseId: "crs_math_1550",
    role: "advisor"
  }
];
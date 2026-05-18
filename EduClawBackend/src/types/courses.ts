export interface Outcome {
  id: string;
  code: string;
  description: string;
}

export interface Material {
  id: string;
  title: string;
  type: "textbook" | "lecture" | "worksheet";
  url: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  term: string;
  facultyIds: string[];
  outcomes: Outcome[];
  materials: Material[];
}

export interface CourseEnrollment {
  userId: string;
  courseId: string;
  role: "student" | "faculty" | "advisor";
}

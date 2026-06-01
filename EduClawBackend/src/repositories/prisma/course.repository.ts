import { prisma } from "../../db/prisma.js";
import type { Course, CourseEnrollment, Material, Outcome } from "../../types/courses.js";
import type { User, UserRole } from "../../types/auth.js";

const mapCourse = (course: {
  id: string;
  code: string;
  title: string;
  term: string;
  outcomes: Outcome[];
  materials: Material[];
}): Course => ({
  id: course.id,
  code: course.code,
  title: course.title,
  term: course.term,
  facultyIds: [],
  outcomes: course.outcomes,
  materials: course.materials
});

export const listCoursesForUser = async (userId: string, roles: UserRole[]): Promise<Course[]> => {
  if (roles.includes("admin")) {
    const courses = await prisma.course.findMany({
      where: { deletedAt: null },
      include: { outcomes: true, materials: true },
      orderBy: { createdAt: "asc" }
    });
    return courses.map(mapCourse);
  }

  const enrollments = await prisma.enrollment.findMany({ where: { userId }, select: { courseId: true } });
  const courseIds = enrollments.map((item: { courseId: string }) => item.courseId);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, deletedAt: null },
    include: { outcomes: true, materials: true },
    orderBy: { createdAt: "asc" }
  });
  return courses.map(mapCourse);
};

export const findCourseById = async (courseId: string): Promise<Course | null> => {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    include: { outcomes: true, materials: true }
  });
  if (!course) return null;
  return mapCourse(course);
};

export const hasCourseAccess = async (userId: string, courseId: string): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  return Boolean(enrollment);
};

export const hasCourseEnrollment = async (userId: string, courseId: string): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  return Boolean(enrollment);
};

export const hasCourseEnrollmentRole = async (
  userId: string,
  courseId: string,
  roles: CourseEnrollment["role"][]
): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId, courseId } } });
  return Boolean(enrollment && roles.includes(enrollment.role));
};

export const listCourseIdsForEnrollmentRole = async (
  userId: string,
  roles: CourseEnrollment["role"][]
): Promise<string[]> => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId, role: { in: roles } },
    select: { courseId: true }
  });
  return enrollments.map((item: { courseId: string }) => item.courseId);
};

export const sharesCourseWithLearner = async (actorUserId: string, learnerId: string): Promise<boolean> => {
  const actor = await prisma.enrollment.findMany({ where: { userId: actorUserId }, select: { courseId: true } });
  if (actor.length === 0) return false;
  const actorCourseIds = actor.map((item: { courseId: string }) => item.courseId);
  const learner = await prisma.enrollment.findFirst({ where: { userId: learnerId, courseId: { in: actorCourseIds } } });
  return Boolean(learner);
};

export interface CourseRosterEntry {
  role: CourseEnrollment["role"];
  user: User;
}

export const listCourseRoster = async (courseId: string): Promise<CourseRosterEntry[]> => {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { user: true },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });
  const userIds = enrollments.map((enrollment) => enrollment.userId);
  const roleAssignments = await prisma.userRoleAssignment.findMany({
    where: { userId: { in: userIds } },
    orderBy: { roleName: "asc" }
  });
  const rolesByUserId = new Map<string, UserRole[]>();
  for (const assignment of roleAssignments) {
    rolesByUserId.set(assignment.userId, [
      ...(rolesByUserId.get(assignment.userId) ?? []),
      assignment.roleName as UserRole
    ]);
  }

  return enrollments
    .filter((enrollment) => enrollment.user.deletedAt === null)
    .map((enrollment) => ({
      role: enrollment.role,
      user: {
        id: enrollment.user.id,
        name: enrollment.user.name,
        email: enrollment.user.email,
        roles: rolesByUserId.get(enrollment.user.id) ?? []
      }
    }));
};

import { Router } from "express";
import { HttpError } from "../../common/errors.js";
import { asyncHandler } from "../../common/async-handler.js";
import { findCourseById, hasCourseAccess, hasCourseEnrollmentRole, listCourseRoster, listCoursesForUser } from "../../repositories/prisma/course.repository.js";
import type { Course } from "../../types/courses.js";

const courseView = (course: Course) => ({
  id: course.id,
  code: course.code,
  title: course.title,
  term: course.term
});

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const isAdmin = (roles: string[]): boolean => roles.includes("admin");
const isFaculty = (roles: string[]): boolean => roles.includes("faculty");

const assertRosterAccess = async (userId: string, roles: string[], courseId: string): Promise<void> => {
  if (isAdmin(roles)) {
    return;
  }

  if (isFaculty(roles) && (await hasCourseEnrollmentRole(userId, courseId, ["faculty"]))) {
    return;
  }

  throw new HttpError(403, "ROSTER_FORBIDDEN", "No roster access for this course");
};

export const coursesRouter = Router();

coursesRouter.get("/", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const courses = await listCoursesForUser(authUser.id, authUser.roles);
  return res.status(200).json({ courses: courses.map(courseView) });
}));

coursesRouter.get("/:courseId", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const courseId = requireParam(req.params.courseId, "courseId");
  const course = await findCourseById(courseId);
  if (!course) {
    throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  if (!isAdmin(authUser.roles) && !(await hasCourseAccess(authUser.id, courseId))) {
    throw new HttpError(403, "COURSE_FORBIDDEN", "No access to this course");
  }

  return res.status(200).json({ course: courseView(course) });
}));

coursesRouter.get("/:courseId/outcomes", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const courseId = requireParam(req.params.courseId, "courseId");
  const course = await findCourseById(courseId);
  if (!course) {
    throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  if (!isAdmin(authUser.roles) && !(await hasCourseAccess(authUser.id, courseId))) {
    throw new HttpError(403, "COURSE_FORBIDDEN", "No access to this course");
  }

  return res.status(200).json({ outcomes: course.outcomes });
}));

coursesRouter.get("/:courseId/materials", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const courseId = requireParam(req.params.courseId, "courseId");
  const course = await findCourseById(courseId);
  if (!course) {
    throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  if (!isAdmin(authUser.roles) && !(await hasCourseAccess(authUser.id, courseId))) {
    throw new HttpError(403, "COURSE_FORBIDDEN", "No access to this course");
  }

  return res.status(200).json({ materials: course.materials });
}));

coursesRouter.get("/:courseId/roster", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const courseId = requireParam(req.params.courseId, "courseId");
  const course = await findCourseById(courseId);
  if (!course) {
    throw new HttpError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  await assertRosterAccess(authUser.id, authUser.roles, courseId);
  const roster = await listCourseRoster(courseId);
  return res.status(200).json({ roster });
}));

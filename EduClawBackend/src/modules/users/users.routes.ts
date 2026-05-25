import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/async-handler.js";
import { HttpError } from "../../common/errors.js";
import { createAuditLog } from "../../repositories/prisma/admin.repository.js";
import { sharesCourseWithLearner } from "../../repositories/prisma/course.repository.js";
import { findUserById, listUsers, updateUserRole } from "../../repositories/prisma/user.repository.js";
import type { User, UserRole } from "../../types/auth.js";

const updateRolesSchema = z.object({
  roles: z.array(z.enum(["student", "faculty", "advisor", "admin", "auditor"])).min(1).max(1)
});

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

const userView = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  roles: user.roles
});

const hasRole = (roles: UserRole[], role: UserRole): boolean => roles.includes(role);

const assertUserReadAccess = async (actorUserId: string, actorRoles: UserRole[], targetUserId: string): Promise<void> => {
  if (hasRole(actorRoles, "admin") || actorUserId === targetUserId) {
    return;
  }

  if (hasRole(actorRoles, "faculty") && (await sharesCourseWithLearner(actorUserId, targetUserId))) {
    return;
  }

  throw new HttpError(403, "USER_FORBIDDEN", "Insufficient permissions for user profile access");
};

export const usersRouter = Router();

usersRouter.get("/", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  if (!hasRole(authUser.roles, "admin")) {
    throw new HttpError(403, "USER_FORBIDDEN", "Only admins can list users");
  }

  const users = await listUsers();
  return res.status(200).json({ users: users.map(userView) });
}));

usersRouter.get("/:id", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  const userId = requireParam(req.params.id, "id");
  const user = await findUserById(userId);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  await assertUserReadAccess(authUser.id, authUser.roles, userId);
  return res.status(200).json({ user: userView(user) });
}));

usersRouter.put("/:id/roles", asyncHandler(async (req, res) => {
  const authUser = req.authUser;
  if (!authUser) {
    throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
  }

  if (!hasRole(authUser.roles, "admin")) {
    throw new HttpError(403, "USER_FORBIDDEN", "Only admins can update user roles");
  }

  const userId = requireParam(req.params.id, "id");
  const body = updateRolesSchema.parse(req.body);
  const role = body.roles[0];
  const user = await updateUserRole(userId, role);
  if (!user) {
    throw new HttpError(404, "USER_NOT_FOUND", "User not found");
  }

  await createAuditLog({
    actorUserId: authUser.id,
    action: "user.roles.update",
    targetType: "user",
    targetId: user.id,
    metadata: {
      roles: user.roles
    }
  });

  return res.status(200).json({ user: userView(user) });
}));

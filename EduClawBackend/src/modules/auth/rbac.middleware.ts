import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../types/auth.js";
import { HttpError } from "../../common/errors.js";

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authUser = req.authUser;
    if (!authUser) {
      next(new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized"));
      return;
    }

    const hasRole = authUser.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      next(new HttpError(403, "AUTH_FORBIDDEN", "Insufficient role permissions"));
      return;
    }

    next();
  };
};

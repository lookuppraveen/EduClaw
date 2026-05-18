import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim().length > 0 ? incoming : randomUUID();
  res.setHeader("x-request-id", requestId);
  req.requestId = requestId;
  next();
};

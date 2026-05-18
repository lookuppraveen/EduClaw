import express from "express";
import cors from "cors";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter, meHandler } from "./modules/auth/auth.routes.js";
import { requireAuth } from "./modules/auth/auth.middleware.js";
import { requestContextMiddleware } from "./common/request-context.js";
import { errorMiddleware } from "./common/error-middleware.js";
import { requireRoles } from "./modules/auth/rbac.middleware.js";
import { coursesRouter } from "./modules/courses/courses.routes.js";
import { learnerStateRouter } from "./modules/learner-state/learner-state.routes.js";
import { consentRouter } from "./modules/consent/consent.routes.js";
import { conversationsRouter } from "./modules/conversations/conversations.routes.js";
import { turnsRouter } from "./modules/conversations/turns.routes.js";
import { policiesRouter } from "./modules/policies/policies.routes.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(requestContextMiddleware);

app.use("/api/v1", healthRouter);
app.use("/api/v1/auth", authRouter);
app.get("/api/v1/auth/me", requireAuth, meHandler);
app.use("/api/v1/courses", requireAuth, requireRoles(["student", "faculty", "advisor", "admin", "auditor"]), coursesRouter);
app.use("/api/v1/learners", requireAuth, requireRoles(["student", "faculty", "advisor", "admin", "auditor"]), learnerStateRouter);
app.use("/api/v1/consents", requireAuth, requireRoles(["student", "faculty", "advisor", "admin", "auditor"]), consentRouter);
app.use("/api/v1/conversations", requireAuth, requireRoles(["student", "faculty", "advisor", "admin", "auditor"]), conversationsRouter);
app.use("/api/v1/turns", requireAuth, requireRoles(["student", "faculty", "advisor", "admin", "auditor"]), turnsRouter);
app.use("/api/v1/policies", requireAuth, requireRoles(["faculty", "admin"]), policiesRouter);

app.use(errorMiddleware);

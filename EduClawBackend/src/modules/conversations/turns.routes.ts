import { Router } from "express";
import { asyncHandler } from "../../common/async-handler.js";
import { ConversationController } from "./controllers/conversation.controller.js";
import { PrismaConversationRepository } from "./repositories/prisma-conversation.repository.js";
import { ConversationService } from "./services/conversation.service.js";
import { MockOrchestratorService } from "./services/mock-orchestrator.service.js";

const repository = new PrismaConversationRepository();
const orchestrator = new MockOrchestratorService();
const service = new ConversationService(repository, orchestrator);
const controller = new ConversationController(service);

export const turnsRouter = Router();

/**
 * @openapi
 * /api/v1/turns/{turnId}/trace:
 *   get:
 *     summary: Get turn trace visibility-filtered by role
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: turnId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turn trace
 */
turnsRouter.get("/:turnId/trace", asyncHandler(controller.getTurnTrace));

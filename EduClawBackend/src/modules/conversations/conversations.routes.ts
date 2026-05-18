import { Router } from "express";
import { asyncHandler } from "../../common/async-handler.js";
import { ConversationController } from "./controllers/conversation.controller.js";
import { PrismaConversationRepository } from "./repositories/prisma-conversation.repository.js";
import { ConversationService } from "./services/conversation.service.js";
import { MockOrchestratorService } from "./services/mock-orchestrator.service.js";
import { PolicyEvaluatorService } from "../policies/services/policy-evaluator.service.js";

const repository = new PrismaConversationRepository();
const orchestrator = new MockOrchestratorService();
const policyEvaluator = new PolicyEvaluatorService();
const service = new ConversationService(repository, orchestrator, policyEvaluator);
const controller = new ConversationController(service);

export const conversationsRouter = Router();

/**
 * @openapi
 * /api/v1/conversations:
 *   post:
 *     summary: Create conversation
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Conversation created
 */
conversationsRouter.post("/", asyncHandler(controller.createConversation));

/**
 * @openapi
 * /api/v1/conversations/{id}:
 *   get:
 *     summary: Get conversation details
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation details
 */
conversationsRouter.get("/:id", asyncHandler(controller.getConversation));

/**
 * @openapi
 * /api/v1/conversations/{id}/turns:
 *   get:
 *     summary: List conversation turns
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation turns
 */
conversationsRouter.get("/:id/turns", asyncHandler(controller.listTurns));

/**
 * @openapi
 * /api/v1/conversations/{id}/turns:
 *   post:
 *     summary: Create conversation turn
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Turn created
 */
conversationsRouter.post("/:id/turns", asyncHandler(controller.createTurn));


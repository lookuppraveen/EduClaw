import type { Request, Response } from "express";
import { HttpError } from "../../../common/errors.js";
import { createConversationSchema, createTurnSchema } from "../dto/conversation.dto.js";
import { mapConversationDto } from "../dto/conversation.response.dto.js";
import type { ConversationService } from "../services/conversation.service.js";

const requireParam = (value: string | string[] | undefined, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", `Missing or invalid path parameter: ${name}`);
  }
  return value;
};

export class ConversationController {
  constructor(private readonly service: ConversationService) {}

  createConversation = async (req: Request, res: Response): Promise<Response> => {
    const authUser = req.authUser;
    if (!authUser) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    const input = createConversationSchema.parse(req.body);
    const conversation = await this.service.createConversation(
      { userId: authUser.id, roles: authUser.roles },
      input
    );

    return res.status(201).json({ conversation: mapConversationDto(conversation) });
  };

  getConversation = async (req: Request, res: Response): Promise<Response> => {
    const authUser = req.authUser;
    if (!authUser) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    const conversationId = requireParam(req.params.id, "id");
    const conversation = await this.service.getConversation(
      { userId: authUser.id, roles: authUser.roles },
      conversationId
    );

    return res.status(200).json({ conversation: mapConversationDto(conversation) });
  };

  listTurns = async (req: Request, res: Response): Promise<Response> => {
    const authUser = req.authUser;
    if (!authUser) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    const conversationId = requireParam(req.params.id, "id");
    const turns = await this.service.listTurns(
      { userId: authUser.id, roles: authUser.roles },
      conversationId
    );

    return res.status(200).json({ turns });
  };

  createTurn = async (req: Request, res: Response): Promise<Response> => {
    const authUser = req.authUser;
    if (!authUser) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    const input = createTurnSchema.parse(req.body);
    const conversationId = requireParam(req.params.id, "id");
    const turn = await this.service.createTurn(
      { userId: authUser.id, roles: authUser.roles },
      conversationId,
      input
    );

    return res.status(201).json({ turn });
  };

  getTurnTrace = async (req: Request, res: Response): Promise<Response> => {
    const authUser = req.authUser;
    if (!authUser) {
      throw new HttpError(401, "AUTH_UNAUTHORIZED", "Unauthorized");
    }

    const turnId = requireParam(req.params.turnId, "turnId");
    const trace = await this.service.getTurnTrace(
      { userId: authUser.id, roles: authUser.roles },
      turnId
    );

    return res.status(200).json({ trace });
  };
}

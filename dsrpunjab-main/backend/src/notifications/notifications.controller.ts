import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../common/exceptions/api-error.js";
import { jsonSafe } from "../common/utils/json-safe.js";
import { notificationsService, type NotificationsService } from "./notifications.service.js";

function notificationId(value: string | string[]) {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized || !/^\d+$/.test(normalized)) {
    throw new ApiError(400, "INVALID_NOTIFICATION_ID", "Invalid notification id");
  }
  return BigInt(normalized);
}

function projectId(value: unknown) {
  const normalized = String(value ?? "");
  if (!/^\d+$/.test(normalized)) {
    throw new ApiError(400, "INVALID_PROJECT_ID", "Invalid project id");
  }
  return BigInt(normalized);
}

export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Number.parseInt(String(req.query.limit || "30"), 10);
      res.json(jsonSafe(await this.service.inbox(req.user!.id, Number.isFinite(limit) ? limit : 30)));
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.markRead(req.user!.id, notificationId(req.params.id)));
    } catch (error) {
      next(error);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.markAllRead(req.user!.id));
    } catch (error) {
      next(error);
    }
  };

  clearRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.service.clearRead(req.user!.id));
    } catch (error) {
      next(error);
    }
  };

  sendReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body ?? {};
      res.status(201).json(await this.service.sendReview(req.user!, {
        projectId: projectId(body.projectId),
        sectionId: String(body.sectionId ?? ""),
        sectionLabel: String(body.sectionLabel ?? ""),
        note: String(body.note ?? ""),
        recipientRoles: Array.isArray(body.recipientRoles)
          ? body.recipientRoles.map((role: unknown) => String(role))
          : [],
      }));
    } catch (error) {
      next(error);
    }
  };
}

export const notificationsController = new NotificationsController(notificationsService);

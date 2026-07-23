import { Router } from "express";
import { notificationsController } from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", notificationsController.list);
notificationsRouter.post("/review", notificationsController.sendReview);
notificationsRouter.patch("/read-all", notificationsController.markAllRead);
notificationsRouter.delete("/read", notificationsController.clearRead);
notificationsRouter.patch("/:id/read", notificationsController.markRead);

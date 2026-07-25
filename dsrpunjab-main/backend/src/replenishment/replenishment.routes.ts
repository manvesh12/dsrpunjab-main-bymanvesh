import { Router } from "express";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { replenishmentController } from "./replenishment.controller.js";
import multer from "multer";
import { requireAnyPermission, requirePermissions } from "../authorization/permissions.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });

export const replenishmentRouter = Router();

const canViewReplenishment = requireAnyPermission(["SECTION_REPLENISHMENT_EDIT", "REPORT_VIEW"]);
const canEditReplenishment = requirePermissions(["SECTION_REPLENISHMENT_EDIT"]);
replenishmentRouter.get("/projects/:projectId/replenishment", requireAuth, canViewReplenishment, replenishmentController.list);
replenishmentRouter.post("/projects/:projectId/replenishment", requireAuth, canEditReplenishment, replenishmentController.create);
replenishmentRouter.get("/replenishment/approved-dsrs", requireAuth, canViewReplenishment, replenishmentController.listApprovedDsrs);
replenishmentRouter.get("/replenishment/:id", requireAuth, canViewReplenishment, replenishmentController.get);
replenishmentRouter.put("/replenishment/:id", requireAuth, canEditReplenishment, replenishmentController.update);
replenishmentRouter.delete("/replenishment/:id", requireAuth, canEditReplenishment, replenishmentController.delete);

// Replenishment Report Builder Specific Routes
replenishmentRouter.post("/replenishment/:id/fetch-final-dsr", requireAuth, canEditReplenishment, replenishmentController.fetchFinalDsr);
replenishmentRouter.put("/replenishment/:id/state", requireAuth, canEditReplenishment, replenishmentController.saveState);
replenishmentRouter.post("/replenishment/:id/upload", requireAuth, canEditReplenishment, upload.single("file"), replenishmentController.upload);
replenishmentRouter.get("/replenishment/:id/files", requireAuth, canViewReplenishment, replenishmentController.listFiles);
replenishmentRouter.get("/replenishment/:id/files/:fileId/download", requireAuth, canViewReplenishment, replenishmentController.downloadFile);
replenishmentRouter.post("/replenishment/:id/workflow", requireAuth, canEditReplenishment, replenishmentController.workflow);
replenishmentRouter.post("/replenishment/:id/generate-ai", requireAuth, canEditReplenishment, replenishmentController.generateAi);

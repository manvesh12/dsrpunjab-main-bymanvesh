import { Router } from "express";
import { z } from "zod";
import { jsonSafe } from "../common/utils/json-safe.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { requireAuth } from "../authentication/authentication.middleware.js";
import { environment } from "../config/environment.js";
import { sessionCookieOptions } from "../auth/auth.constants.js";
import { delegatedSessionService } from "./delegated-session.service.js";

const createSchema = z.object({
  recipientEmail: z.string().email(),
  durationMinutes: z.coerce.number().int().min(15).max(10080),
  label: z.string().max(100).optional(),
});
const verifySchema = z.object({ otp: z.string().regex(/^\d{6}$/) });

export const delegatedSessionRouter = Router();

delegatedSessionRouter.get("/auth/delegated-session/:token", async (req, res, next) => {
  try { res.json(jsonSafe(await delegatedSessionService.details(String(req.params.token)))); }
  catch (error) { next(error); }
});

delegatedSessionRouter.post("/auth/delegated-session/:token/verify", async (req, res, next) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "DELEGATED_MFA_INPUT_INVALID", "Enter the 6-digit MFA code.");
    const response = await delegatedSessionService.verify(String(req.params.token), parsed.data.otp);
    res.cookie(environment.sessionCookieName, response.token, {
      ...sessionCookieOptions,
      expires: new Date(response.delegated.expiresAt),
    });
    res.clearCookie("dsr_refresh_token", { path: "/api/auth/refresh" });
    res.json(jsonSafe(response));
  } catch (error) { next(error); }
});

delegatedSessionRouter.get("/users/me/delegated-sessions", requireAuth, async (req, res, next) => {
  try { res.json(jsonSafe(await delegatedSessionService.list(req.user!.id))); }
  catch (error) { next(error); }
});

delegatedSessionRouter.post("/users/me/delegated-sessions", requireAuth, async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw new ApiError(400, "DELEGATED_SESSION_INPUT_INVALID", "Valid email and duration are required.");
    res.status(201).json(jsonSafe(await delegatedSessionService.create(req.user!.id, parsed.data)));
  } catch (error) { next(error); }
});

delegatedSessionRouter.delete("/users/me/delegated-sessions/:id", requireAuth, async (req, res, next) => {
  try { res.json(await delegatedSessionService.revoke(req.user!.id, String(req.params.id))); }
  catch (error) { next(error); }
});

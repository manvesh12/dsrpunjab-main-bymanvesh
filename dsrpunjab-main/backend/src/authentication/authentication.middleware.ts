import type { NextFunction, Request, Response } from "express";
import { environment } from "../config/environment.js";
import { authenticationRepository } from "./authentication.repository.js";
import { tokenService } from "./token.service.js";
import { prisma } from "../database/prisma.client.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  const cookieToken = typeof req.cookies?.[environment.sessionCookieName] === "string" ? req.cookies[environment.sessionCookieName] : "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : cookieToken;
  if (!token) { res.status(401).json({ error: "Not logged in" }); return; }
  try {
    const payload = tokenService.payload(token);
    if (payload.delegatedSessionId) {
      const delegated = await prisma.delegatedSession.findUnique({ where: { id: payload.delegatedSessionId } });
      if (!delegated || delegated.revokedAt || !delegated.activatedAt || delegated.expiresAt <= new Date()) {
        res.status(401).json({ error: "Delegated session expired or revoked" }); return;
      }
    }
    const user = await authenticationRepository.findUser(payload.sub ? BigInt(payload.sub) : 0n);
    if (!user || !user.active) { res.status(401).json({ error: "Invalid session" }); return; }
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "Invalid session" }); }
}

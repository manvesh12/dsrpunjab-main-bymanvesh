import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../database/prisma.client.js";
import { ApiError } from "../common/exceptions/api-error.js";
import { emailService } from "../email/email.service.js";
import { tokenService } from "../authentication/token.service.js";
import { sessionService } from "../auth/session.service.js";

const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export class DelegatedSessionService {
  async create(ownerId: bigint, input: { recipientEmail: string; durationMinutes: number; label?: string }) {
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new ApiError(404, "USER_NOT_FOUND", "User not found.");

    const recipientEmail = input.recipientEmail.trim().toLowerCase();
    if (recipientEmail === owner.email.toLowerCase()) {
      throw new ApiError(400, "DELEGATE_SELF", "Use a different recipient email.");
    }
    const durationMinutes = Math.min(7 * 24 * 60, Math.max(15, Math.floor(input.durationMinutes)));
    const rawToken = crypto.randomBytes(32).toString("hex");
    const otp = String(crypto.randomInt(100000, 1000000));
    const expiresAt = new Date(Date.now() + durationMinutes * 60_000);

    const session = await prisma.delegatedSession.create({
      data: {
        ownerId,
        recipientEmail,
        label: input.label?.trim().slice(0, 100) || null,
        tokenHash: sha256(rawToken),
        otpHash: await bcrypt.hash(otp, 12),
        expiresAt,
      },
    });

    try {
      await emailService.sendDelegatedSessionEmail(
        recipientEmail, owner.fullName, rawToken, otp, expiresAt
      );
    } catch (error) {
      await prisma.delegatedSession.delete({ where: { id: session.id } });
      throw error;
    }
    return this.serialize(session);
  }

  async list(ownerId: bigint) {
    const sessions = await prisma.delegatedSession.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return sessions.map((session) => this.serialize(session));
  }

  async revoke(ownerId: bigint, id: string) {
    const result = await prisma.delegatedSession.updateMany({
      where: { id, ownerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!result.count) throw new ApiError(404, "DELEGATED_SESSION_NOT_FOUND", "Session not found.");
    return { success: true };
  }

  async details(rawToken: string) {
    const session = await this.findValid(rawToken);
    return {
      recipientEmailMasked: session.recipientEmail.replace(/^(.{2}).*(@.*)$/, "$1***$2"),
      ownerName: session.owner.fullName,
      label: session.label,
      expiresAt: session.expiresAt,
    };
  }

  async verify(rawToken: string, otp: string) {
    const session = await this.findValid(rawToken);
    if (session.activatedAt) {
      throw new ApiError(409, "DELEGATED_INVITE_USED", "This invitation has already been used.");
    }
    if (!(await bcrypt.compare(otp, session.otpHash))) {
      throw new ApiError(400, "DELEGATED_MFA_INVALID", "Invalid MFA code.");
    }
    const activated = await prisma.delegatedSession.updateMany({
      where: { id: session.id, activatedAt: null, revokedAt: null },
      data: { activatedAt: new Date() },
    });
    if (!activated.count) throw new ApiError(409, "DELEGATED_INVITE_USED", "This invitation has already been used.");

    const token = tokenService.signDelegated(session.owner, session.id, session.expiresAt);
    return {
      ...(await sessionService.userResponse(session.owner, token)),
      delegated: {
        sessionId: session.id,
        recipientEmail: session.recipientEmail,
        expiresAt: session.expiresAt,
        ownerName: session.owner.fullName,
      },
    };
  }

  private async findValid(rawToken: string) {
    const session = await prisma.delegatedSession.findUnique({
      where: { tokenHash: sha256(rawToken) },
      include: { owner: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.owner.active) {
      throw new ApiError(410, "DELEGATED_INVITE_INVALID", "This session invitation is invalid, revoked, or expired.");
    }
    return session;
  }

  private serialize(session: {
    id: string; recipientEmail: string; label: string | null; expiresAt: Date;
    activatedAt: Date | null; revokedAt: Date | null; createdAt: Date;
  }) {
    return {
      id: session.id,
      recipientEmail: session.recipientEmail,
      label: session.label,
      expiresAt: session.expiresAt,
      activatedAt: session.activatedAt,
      revokedAt: session.revokedAt,
      createdAt: session.createdAt,
      status: session.revokedAt ? "REVOKED" : session.expiresAt <= new Date() ? "EXPIRED" : session.activatedAt ? "ACTIVE" : "PENDING",
    };
  }
}

export const delegatedSessionService = new DelegatedSessionService();

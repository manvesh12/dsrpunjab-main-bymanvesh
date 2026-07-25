import jwt, { type SignOptions } from "jsonwebtoken";
import { environment } from "../config/environment.js";
import type { AuthUser } from "./auth-user.js";

export class TokenService {
  sign(user: AuthUser) {
    return jwt.sign({ sub: String(user.id), role: user.role, username: user.username }, environment.jwtSecret, {
      expiresIn: environment.jwtExpiresIn as SignOptions["expiresIn"]
    });
  }
  signDelegated(user: AuthUser, delegatedSessionId: string, expiresAt: Date) {
    const secondsRemaining = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    return jwt.sign(
      { sub: String(user.id), role: user.role, username: user.username, delegatedSessionId },
      environment.jwtSecret,
      { expiresIn: secondsRemaining }
    );
  }
  payload(token: string) {
    return jwt.verify(token, environment.jwtSecret) as { sub?: string; delegatedSessionId?: string };
  }
  subject(token: string) {
    const payload = this.payload(token);
    return payload.sub ? BigInt(payload.sub) : 0n;
  }
}

export const tokenService = new TokenService();

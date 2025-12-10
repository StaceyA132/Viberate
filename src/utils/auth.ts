import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env";

export type TokenPayload = {
  sub: string;
  type: "access";
};

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "access" }, env.jwtSecret, {
    expiresIn: env.accessTokenTtl,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
  if (payload.type !== "access") {
    throw new Error("Invalid token type");
  }
  return payload;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "./errorHandler";
import { verifyAccessToken } from "../utils/auth";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new HttpError(401, "Missing authorization header"));
    return;
  }
  const token = header.replace("Bearer ", "");
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      next(new HttpError(401, "User not found"));
      return;
    }
    req.user = { id: user.id, email: user.email, username: user.username };
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

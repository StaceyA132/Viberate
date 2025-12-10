import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validateRequest";
import { generateRefreshToken, hashPassword, signAccessToken, verifyPassword } from "../utils/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
  topVibes: z.array(z.string()).max(3).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

function sanitizedUser(user: { id: string; email: string; username: string; topVibes: string[] }) {
  return { id: user.id, email: user.email, username: user.username, topVibes: user.topVibes };
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.refreshTokenDays * 24 * 60 * 60 * 1000);
}

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const topVibes = req.body.topVibes ?? [];
    const user = await prisma.user.create({
      data: {
        email: req.body.email.toLowerCase(),
        username: req.body.username,
        passwordHash: await hashPassword(req.body.password),
        topVibes,
      },
    });

    const refreshToken = generateRefreshToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.get("user-agent") ?? "",
        expiresAt: refreshExpiry(),
      },
    });

    const accessToken = signAccessToken(user.id);
    res.status(201).json({
      user: sanitizedUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.accessTokenTtl,
      },
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return next(new HttpError(409, "Email or username already in use"));
    }
    next(err);
  }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
    if (!user) return next(new HttpError(401, "Invalid credentials"));

    const valid = await verifyPassword(req.body.password, user.passwordHash);
    if (!valid) return next(new HttpError(401, "Invalid credentials"));

    const refreshToken = generateRefreshToken();
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.get("user-agent") ?? "",
        expiresAt: refreshExpiry(),
      },
    });

    const accessToken = signAccessToken(user.id);
    res.json({
      user: sanitizedUser(user),
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: env.accessTokenTtl,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", validateBody(refreshSchema), async (req, res, next) => {
  try {
    const session = await prisma.session.findUnique({ where: { refreshToken: req.body.refreshToken } });
    if (!session) return next(new HttpError(401, "Invalid refresh token"));
    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } });
      return next(new HttpError(401, "Session expired"));
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return next(new HttpError(401, "User not found"));

    const newRefresh = generateRefreshToken();
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshToken: newRefresh, expiresAt: refreshExpiry() },
    });

    const accessToken = signAccessToken(user.id);
    res.json({
      user: sanitizedUser(user),
      tokens: {
        accessToken,
        refreshToken: newRefresh,
        expiresIn: env.accessTokenTtl,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", validateBody(refreshSchema), async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { refreshToken: req.body.refreshToken } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

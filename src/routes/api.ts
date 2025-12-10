import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validateRequest";
import { requireAuth } from "../middleware/requireAuth";
import { computeAlignment } from "../utils/alignment";

const router = Router();

const statusSchema = z.enum(["want", "watching", "finished"]);

const ratingSchema = z.object({
  score: z.number().min(1).max(10),
  vibes: z.array(z.string()).min(2).max(3),
  status: statusSchema,
  reaction: z.string().max(240).optional(),
  spoiler: z.boolean().optional(),
});

const updateRatingSchema = ratingSchema.partial().extend({
  score: z.number().min(1).max(10).optional(),
  vibes: z.array(z.string()).min(1).max(3).optional(),
});

const journalSchema = z.object({
  ratingId: z.string(),
  favoriteCharacter: z.string().max(80).optional(),
  wouldRewatch: z.boolean().optional(),
  threeWords: z.string().max(80).optional(),
});

router.get("/health", async (_req, res) => {
  const now = new Date().toISOString();
  res.json({ ok: true, service: "VibeRate API", time: now });
});

router.get("/vibes", async (_req, res) => {
  const vibes = await prisma.vibeTag.findMany({ orderBy: { label: "asc" } });
  res.json({ data: vibes.map((v) => v.label) });
});

router.get("/titles/now-playing", async (_req, res) => {
  const titles = await prisma.title.findMany({ where: { collections: { has: "now-playing" } }, take: 20 });
  res.json({ data: titles });
});

router.get("/titles/popular", async (_req, res) => {
  const titles = await prisma.title.findMany({ where: { collections: { has: "popular" } }, take: 20 });
  res.json({ data: titles });
});

router.get("/titles/top-rated", async (_req, res) => {
  const titles = await prisma.title.findMany({ orderBy: { averageScore: "desc" }, take: 20 });
  res.json({ data: titles });
});

router.get("/titles/trending", async (_req, res) => {
  const titles = await prisma.title.findMany({ where: { collections: { has: "trending" } }, take: 20 });
  res.json({ data: titles });
});

router.get("/titles/:id", async (req, res, next) => {
  const title = await prisma.title.findUnique({ where: { id: req.params.id } });
  if (!title) return next(new HttpError(404, "Title not found"));
  res.json({ data: title });
});

async function validateVibes(vibes: string[]) {
  const vibeTags = await prisma.vibeTag.findMany({ where: { label: { in: vibes } } });
  const invalid = vibes.filter((v) => !vibeTags.find((tag) => tag.label === v));
  if (invalid.length) throw new HttpError(400, `Unknown vibe(s): ${invalid.join(", ")}`);
  return vibeTags;
}

async function attachVibes(ratingId: string, vibes: string[]) {
  const vibeTags = await prisma.vibeTag.findMany({ where: { label: { in: vibes } } });
  await prisma.ratingVibe.deleteMany({ where: { ratingId } });
  if (vibeTags.length) {
    await prisma.ratingVibe.createMany({
      data: vibeTags.map((v) => ({ ratingId, vibeTagId: v.id })),
    });
  }
}

async function ratingResponse(id: string) {
  const rating = await prisma.rating.findUnique({
    where: { id },
    include: { vibes: { include: { vibe: true } } },
  });
  if (!rating) return null;
  return {
    id: rating.id,
    userId: rating.userId,
    titleId: rating.titleId,
    score: rating.score,
    status: rating.status,
    reaction: rating.reaction,
    spoiler: rating.spoiler,
    createdAt: rating.createdAt,
    updatedAt: rating.updatedAt,
    vibes: rating.vibes.map((v) => v.vibe.label),
  };
}

async function updateAverageScore(titleId: string) {
  const aggregate = await prisma.rating.aggregate({
    where: { titleId },
    _avg: { score: true },
  });
  await prisma.title.update({
    where: { id: titleId },
    data: { averageScore: aggregate._avg.score ?? 0 },
  });
}

router.post("/titles/:id/rate", requireAuth, validateBody(ratingSchema), async (req, res, next) => {
  try {
    const title = await prisma.title.findUnique({ where: { id: req.params.id } });
    if (!title) return next(new HttpError(404, "Title not found"));

    await validateVibes(req.body.vibes);

    const rating = await prisma.rating.upsert({
      where: { userId_titleId: { userId: req.user!.id, titleId: title.id } },
      update: {
        score: req.body.score,
        status: req.body.status,
        reaction: req.body.reaction,
        spoiler: req.body.spoiler ?? false,
      },
      create: {
        userId: req.user!.id,
        titleId: title.id,
        score: req.body.score,
        status: req.body.status,
        reaction: req.body.reaction,
        spoiler: req.body.spoiler ?? false,
      },
    });

    await attachVibes(rating.id, req.body.vibes);
    await updateAverageScore(title.id);

    const result = await ratingResponse(rating.id);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.patch("/ratings/:id", requireAuth, validateBody(updateRatingSchema), async (req, res, next) => {
  try {
    const rating = await prisma.rating.findUnique({ where: { id: req.params.id } });
    if (!rating) return next(new HttpError(404, "Rating not found"));
    if (rating.userId !== req.user!.id) return next(new HttpError(403, "Cannot edit another user's rating"));

    if (req.body.vibes) {
      await validateVibes(req.body.vibes);
    }

    await prisma.rating.update({
      where: { id: rating.id },
      data: {
        score: req.body.score ?? rating.score,
        status: (req.body.status as typeof rating.status | undefined) ?? rating.status,
        reaction: req.body.reaction ?? rating.reaction,
        spoiler: req.body.spoiler ?? rating.spoiler,
      },
    });

    if (req.body.vibes) {
      await attachVibes(rating.id, req.body.vibes);
    }

    await updateAverageScore(rating.titleId);
    const result = await ratingResponse(rating.id);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.delete("/ratings/:id", requireAuth, async (req, res, next) => {
  try {
    const rating = await prisma.rating.findUnique({ where: { id: req.params.id } });
    if (!rating) return next(new HttpError(404, "Rating not found"));
    if (rating.userId !== req.user!.id) return next(new HttpError(403, "Cannot delete another user's rating"));
    await prisma.ratingVibe.deleteMany({ where: { ratingId: rating.id } });
    await prisma.rating.delete({ where: { id: rating.id } });
    await updateAverageScore(rating.titleId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post(
  "/titles/:id/status",
  requireAuth,
  validateBody(z.object({ status: statusSchema })),
  async (req, res, next) => {
    try {
      const title = await prisma.title.findUnique({ where: { id: req.params.id } });
      if (!title) return next(new HttpError(404, "Title not found"));
      const status = await prisma.viewingStatus.upsert({
        where: { userId_titleId: { userId: req.user!.id, titleId: title.id } },
        update: { status: req.body.status },
        create: { userId: req.user!.id, titleId: title.id, status: req.body.status },
      });
      res.json({ data: status });
    } catch (err) {
      next(err);
    }
  },
);

router.post("/titles/:id/journal", requireAuth, validateBody(journalSchema), async (req, res, next) => {
  try {
    const rating = await prisma.rating.findUnique({ where: { id: req.body.ratingId } });
    if (!rating) return next(new HttpError(404, "Rating not found"));
    if (rating.userId !== req.user!.id) return next(new HttpError(403, "Cannot journal another user's rating"));

    const journal = await prisma.journalEntry.upsert({
      where: { ratingId: rating.id },
      update: {
        favoriteCharacter: req.body.favoriteCharacter,
        wouldRewatch: req.body.wouldRewatch,
        threeWords: req.body.threeWords,
      },
      create: {
        ratingId: rating.id,
        favoriteCharacter: req.body.favoriteCharacter,
        wouldRewatch: req.body.wouldRewatch,
        threeWords: req.body.threeWords,
      },
    });

    res.status(201).json({ data: journal });
  } catch (err) {
    next(err);
  }
});

router.get("/me/feed", requireAuth, async (req, res) => {
  const feed = await prisma.rating.findMany({
    where: { userId: req.user!.id },
    include: { title: true, vibes: { include: { vibe: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    data: feed.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.score,
      status: r.status,
      reaction: r.reaction,
      spoiler: r.spoiler,
      vibes: r.vibes.map((v) => v.vibe.label),
      createdAt: r.createdAt,
    })),
  });
});

router.get("/users/:id/feed", async (req, res) => {
  const feed = await prisma.rating.findMany({
    where: { userId: req.params.id },
    include: { title: true, vibes: { include: { vibe: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    data: feed.map((r) => ({
      id: r.id,
      title: r.title,
      score: r.score,
      status: r.status,
      reaction: r.reaction,
      spoiler: r.spoiler,
      vibes: r.vibes.map((v) => v.vibe.label),
      createdAt: r.createdAt,
    })),
  });
});

router.get("/users/:id/alignment", async (req, res, next) => {
  const friendId = req.query.friendId as string | undefined;
  if (!friendId) return next(new HttpError(400, "friendId query param required"));
  const [user, friend] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.params.id } }),
    prisma.user.findUnique({ where: { id: friendId } }),
  ]);
  if (!user || !friend) return next(new HttpError(404, "User not found"));

  const [userRatings, friendRatings] = await Promise.all([
    prisma.rating.findMany({
      where: { userId: user.id },
      include: { vibes: { include: { vibe: true } } },
    }),
    prisma.rating.findMany({
      where: { userId: friend.id },
      include: { vibes: { include: { vibe: true } } },
    }),
  ]);

  const userRatingsShaped = userRatings.map((r) => ({
    titleId: r.titleId,
    score: r.score,
    vibes: r.vibes.map((v) => v.vibe.label),
  }));
  const friendRatingsShaped = friendRatings.map((r) => ({
    titleId: r.titleId,
    score: r.score,
    vibes: r.vibes.map((v) => v.vibe.label),
  }));

  const alignment = computeAlignment(userRatingsShaped, friendRatingsShaped);

  const snapshot = await prisma.alignmentSnapshot.upsert({
    where: { userId_friendId: { userId: user.id, friendId: friend.id } },
    update: { agreement: alignment.agreement, sharedTitles: alignment.sharedTitles, calculatedAt: new Date() },
    create: {
      userId: user.id,
      friendId: friend.id,
      agreement: alignment.agreement,
      sharedTitles: alignment.sharedTitles,
    },
  });

  res.json({ data: snapshot });
});

router.post("/users/:id/follow", requireAuth, async (req, res, next) => {
  if (req.user!.id === req.params.id) return next(new HttpError(400, "Cannot follow yourself"));
  try {
    const follow = await prisma.friendship.create({
      data: { followerId: req.user!.id, followeeId: req.params.id },
    });
    res.status(201).json({ data: follow });
  } catch (err: any) {
    if (err?.code === "P2002") return next(new HttpError(409, "Already following"));
    next(err);
  }
});

router.delete("/users/:id/follow", requireAuth, async (req, res, next) => {
  try {
    await prisma.friendship.delete({
      where: { followerId_followeeId: { followerId: req.user!.id, followeeId: req.params.id } },
    });
    res.status(204).send();
  } catch (err: any) {
    if (err?.code === "P2025") return next(new HttpError(404, "Follow relationship not found"));
    next(err);
  }
});

router.get("/users/:id/lists", (_req, res) => {
  res.json({ data: [] });
});

export default router;

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const vibeLabels = [
    "Cozy",
    "Chaotic",
    "Mind-blowing",
    "Comfort show",
    "Background noise",
    "Dark",
    "Funny",
    "Emotional",
    "Slow burn",
    "Hype",
    "Weird",
    "Uplifting",
  ];

  await Promise.all(
    vibeLabels.map((label) =>
      prisma.vibeTag.upsert({
        where: { label },
        update: {},
        create: { label },
      }),
    ),
  );

  const [tyler, cozy, space] = await Promise.all([
    prisma.title.upsert({
      where: { tmdbId: 123 },
      update: {},
      create: {
        tmdbId: 123,
        mediaType: "movie",
        name: "Extraction 3",
        overview: "Tyler Rake returns for another daring mission.",
        posterUrl: "https://image.tmdb.org/t/p/w500/extraction3.jpg",
        backdropUrl: "https://image.tmdb.org/t/p/w1280/extraction3-bg.jpg",
        releaseDate: new Date("2024-07-04"),
        streamingOn: ["Netflix"],
        genres: ["Action", "Thriller"],
        collections: ["now-playing", "popular", "trending"],
        averageScore: 7.8,
      },
    }),
    prisma.title.upsert({
      where: { tmdbId: 456 },
      update: {},
      create: {
        tmdbId: 456,
        mediaType: "tv",
        name: "Cozy Show",
        overview: "A warm ensemble comedy about neighborhood friends.",
        posterUrl: "https://image.tmdb.org/t/p/w500/cozyshow.jpg",
        backdropUrl: "https://image.tmdb.org/t/p/w1280/cozyshow-bg.jpg",
        releaseDate: new Date("2024-05-15"),
        streamingOn: ["Hulu"],
        genres: ["Comedy"],
        collections: ["top-rated", "trending"],
        averageScore: 8.6,
      },
    }),
    prisma.title.upsert({
      where: { tmdbId: 789 },
      update: {},
      create: {
        tmdbId: 789,
        mediaType: "tv",
        name: "Space Odyssey",
        overview: "Crew members confront the unknown at the edge of the galaxy.",
        posterUrl: "https://image.tmdb.org/t/p/w500/spaceodyssey.jpg",
        backdropUrl: "https://image.tmdb.org/t/p/w1280/spaceodyssey-bg.jpg",
        releaseDate: new Date("2024-06-02"),
        streamingOn: ["Max"],
        genres: ["Sci-Fi", "Drama"],
        collections: ["now-playing", "top-rated"],
        averageScore: 9.1,
      },
    }),
  ]);

  const [ava, jay, lee] = await Promise.all([
    prisma.user.upsert({
      where: { email: "ava@example.com" },
      update: {},
      create: {
        email: "ava@example.com",
        username: "ava",
        passwordHash: await bcrypt.hash("password123", 10),
        topVibes: ["Cozy", "Emotional", "Slow burn"],
      },
    }),
    prisma.user.upsert({
      where: { email: "jay@example.com" },
      update: {},
      create: {
        email: "jay@example.com",
        username: "jay",
        passwordHash: await bcrypt.hash("password123", 10),
        topVibes: ["Hype", "Chaotic", "Mind-blowing"],
      },
    }),
    prisma.user.upsert({
      where: { email: "lee@example.com" },
      update: {},
      create: {
        email: "lee@example.com",
        username: "lee",
        passwordHash: await bcrypt.hash("password123", 10),
        topVibes: ["Comfort show", "Funny", "Cozy"],
      },
    }),
  ]);

  const vibeMap = Object.fromEntries(
    (await prisma.vibeTag.findMany()).map((v) => [v.label, v.id]),
  );

  const ratings = await Promise.all([
    prisma.rating.upsert({
      where: { userId_titleId: { userId: ava.id, titleId: space.id } },
      update: {},
      create: {
        userId: ava.id,
        titleId: space.id,
        score: 9,
        status: "finished",
        reaction: "Blew my mind without spoiling anything.",
        spoiler: false,
      },
    }),
    prisma.rating.upsert({
      where: { userId_titleId: { userId: jay.id, titleId: tyler.id } },
      update: {},
      create: {
        userId: jay.id,
        titleId: tyler.id,
        score: 8,
        status: "finished",
        reaction: "Explosions on explosions (spoiler-lite).",
        spoiler: true,
      },
    }),
    prisma.rating.upsert({
      where: { userId_titleId: { userId: lee.id, titleId: cozy.id } },
      update: {},
      create: {
        userId: lee.id,
        titleId: cozy.id,
        score: 9,
        status: "watching",
        reaction: "Perfect background comfort.",
        spoiler: false,
      },
    }),
  ]);

  await prisma.ratingVibe.createMany({
    data: [
      ...["Mind-blowing", "Dark", "Slow burn"].map((label) => ({
        ratingId: ratings[0].id,
        vibeTagId: vibeMap[label],
      })),
      ...["Hype", "Chaotic", "Background noise"].map((label) => ({
        ratingId: ratings[1].id,
        vibeTagId: vibeMap[label],
      })),
      ...["Cozy", "Comfort show", "Funny"].map((label) => ({
        ratingId: ratings[2].id,
        vibeTagId: vibeMap[label],
      })),
    ],
    skipDuplicates: true,
  });

  await prisma.viewingStatus.upsert({
    where: { userId_titleId: { userId: lee.id, titleId: cozy.id } },
    update: { status: "watching" },
    create: { userId: lee.id, titleId: cozy.id, status: "watching" },
  });

  await prisma.friendship.upsert({
    where: { followerId_followeeId: { followerId: ava.id, followeeId: jay.id } },
    update: {},
    create: { followerId: ava.id, followeeId: jay.id },
  });

  await prisma.friendship.upsert({
    where: { followerId_followeeId: { followerId: ava.id, followeeId: lee.id } },
    update: {},
    create: { followerId: ava.id, followeeId: lee.id },
  });

  // Simple alignment snapshot example
  await prisma.alignmentSnapshot.upsert({
    where: { userId_friendId: { userId: ava.id, friendId: jay.id } },
    update: { agreement: 0.62, sharedTitles: 1 },
    create: { userId: ava.id, friendId: jay.id, agreement: 0.62, sharedTitles: 1 },
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

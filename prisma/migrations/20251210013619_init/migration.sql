-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('movie', 'tv');

-- CreateEnum
CREATE TYPE "WatchStatus" AS ENUM ('want', 'watching', 'finished');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "topVibes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "mediaType" "MediaType" NOT NULL,
    "name" TEXT NOT NULL,
    "overview" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "streamingOn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "collections" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VibeTag" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "VibeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "reaction" TEXT,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatingVibe" (
    "ratingId" TEXT NOT NULL,
    "vibeTagId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RatingVibe_pkey" PRIMARY KEY ("ratingId","vibeTagId")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "favoriteCharacter" TEXT,
    "wouldRewatch" BOOLEAN,
    "threeWords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "followerId" TEXT NOT NULL,
    "followeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("followerId","followeeId")
);

-- CreateTable
CREATE TABLE "AlignmentSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "agreement" DOUBLE PRECISION NOT NULL,
    "sharedTitles" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlignmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewingStatus" (
    "userId" TEXT NOT NULL,
    "titleId" TEXT NOT NULL,
    "status" "WatchStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewingStatus_pkey" PRIMARY KEY ("userId","titleId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Title_tmdbId_key" ON "Title"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "VibeTag_label_key" ON "VibeTag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_userId_titleId_key" ON "Rating"("userId", "titleId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_ratingId_key" ON "JournalEntry"("ratingId");

-- CreateIndex
CREATE UNIQUE INDEX "AlignmentSnapshot_userId_friendId_key" ON "AlignmentSnapshot"("userId", "friendId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingVibe" ADD CONSTRAINT "RatingVibe_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatingVibe" ADD CONSTRAINT "RatingVibe_vibeTagId_fkey" FOREIGN KEY ("vibeTagId") REFERENCES "VibeTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "Rating"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_followeeId_fkey" FOREIGN KEY ("followeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentSnapshot" ADD CONSTRAINT "AlignmentSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlignmentSnapshot" ADD CONSTRAINT "AlignmentSnapshot_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingStatus" ADD CONSTRAINT "ViewingStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingStatus" ADD CONSTRAINT "ViewingStatus_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

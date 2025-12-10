# VibeRate (WatchStar)

Vibe-first movie and TV ratings: tag titles with vibes, share spoiler-safe reactions, and compare taste alignment with friends.

## What’s here
- Node.js + Express + TypeScript API with Prisma/PostgreSQL models (users, sessions, titles, ratings, vibes, friendships, journals, viewing statuses, alignment snapshots).
- Auth flows (register/login/refresh/logout) with JWT access tokens and database-backed refresh sessions.
- Rating/vibe/status/journal endpoints hitting the DB with validation (`zod`) and alignment calculation.
- Seed script with sample users/titles/vibes, plus TMDb client stub for future ingestion.

## Quick start
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
# API at http://localhost:4000/api
```

Copy `.env.example` to `.env` to set `PORT`, `TMDB_API_KEY`, `DATABASE_URL`, `JWT_SECRET`.

## Auth
- `POST /api/auth/register` — `{ email, username, password, topVibes? }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/refresh` — `{ refreshToken }`
- `POST /api/auth/logout` — `{ refreshToken }`

Bearer access tokens required for rating/status/journal/follow endpoints.

## Notable endpoints
- `GET /api/health`
- `GET /api/vibes` — curated vibe tags from DB
- `GET /api/titles/now-playing|popular|top-rated|trending`
- `GET /api/titles/:id`
- `POST /api/titles/:id/rate` — body: `{ score (1-10), vibes[2-3], status, reaction?, spoiler? }` (auth)
- `PATCH /api/ratings/:id` / `DELETE /api/ratings/:id` (auth)
- `POST /api/titles/:id/status` — quick status updates (auth)
- `POST /api/titles/:id/journal` — `{ ratingId, favoriteCharacter?, wouldRewatch?, threeWords? }` (auth)
- `GET /api/me/feed` (auth) and `/api/users/:id/feed`
- `POST/DELETE /api/users/:id/follow` (auth)
- `GET /api/users/:id/alignment?friendId=...` — cosine-style similarity on scores + vibes with snapshot caching

## Next steps
- Add rate limiting and per-user scoping for feeds/follows to protect from abuse.
- Wire TMDb ingestion (nightly cron for now-playing/trending, on-demand search lookup) and hydrate `collections`.
- Expand tests (alignment calculator, validations, endpoint integration).
- Build SwiftUI client (Home, Detail/Rate, Feed, Profile/Alignment) hitting these routes; optional Next.js/Tailwind web client.

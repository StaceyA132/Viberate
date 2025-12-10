import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  tmdbApiKey: process.env.TMDB_API_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 30),
};

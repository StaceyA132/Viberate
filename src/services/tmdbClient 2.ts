import fetch from "node-fetch";
import { env } from "../config/env";
import { Title } from "../types/domain";

// Minimal TMDb client; for now only fetches details for a title id.
export async function fetchTmdbTitle(tmdbId: number): Promise<Title | null> {
  if (!env.tmdbApiKey) return null;
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${env.tmdbApiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return {
    id: `tmdb-${data.id}`,
    tmdbId: data.id,
    mediaType: "movie",
    name: data.title,
    overview: data.overview,
    posterUrl: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
    backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : undefined,
    releaseDate: data.release_date,
    genres: (data.genres ?? []).map((g: { name: string }) => g.name),
    averageScore: data.vote_average,
  };
}

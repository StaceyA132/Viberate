import fetch from "node-fetch";
import { env } from "../config/env";

export type TmdbTitle = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  name: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: Date;
  genres: string[];
  averageScore: number;
  collections?: string[];
};

// Minimal TMDb client; for now only fetches movie details for a TMDb id.
export async function fetchTmdbTitle(tmdbId: number): Promise<TmdbTitle | null> {
  if (!env.tmdbApiKey) return null;
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${env.tmdbApiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  return {
    tmdbId: data.id,
    mediaType: "movie",
    name: data.title,
    overview: data.overview,
    posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : undefined,
    backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : undefined,
    releaseDate: data.release_date ? new Date(data.release_date) : undefined,
    genres: (data.genres ?? []).map((g: { name: string }) => g.name),
    averageScore: data.vote_average,
    collections: ["imported"],
  };
}

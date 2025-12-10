type RatingLike = {
  titleId: string;
  score: number;
  vibes: string[];
};

export function computeAlignment(userRatings: RatingLike[], friendRatings: RatingLike[]) {
  const shared = userRatings
    .map((r) => {
      const match = friendRatings.find((f) => f.titleId === r.titleId);
      return match ? { self: r, friend: match } : null;
    })
    .filter(Boolean) as { self: RatingLike; friend: RatingLike }[];

  if (!shared.length) {
    return { agreement: 0, sharedTitles: 0 };
  }

  const scores = shared.map(({ self, friend }) => {
    const scoreDelta = Math.abs(self.score - friend.score) / 10; // normalize
    const vibeOverlap =
      self.vibes.filter((v) => friend.vibes.includes(v)).length /
      Math.max(self.vibes.length, friend.vibes.length);

    const scoreMatch = 1 - Math.min(scoreDelta, 1);
    const vibeMatch = vibeOverlap;
    return scoreMatch * 0.7 + vibeMatch * 0.3;
  });

  const agreement = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  return { agreement, sharedTitles: shared.length };
}

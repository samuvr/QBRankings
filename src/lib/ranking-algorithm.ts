export type Round = { count: number; points: number[] };

export const ROUNDS: Round[] = [
  { count: 5, points: [5, 4, 3, 2, 1] }, // posiciones 32 → 28
  { count: 5, points: [5, 4, 3, 2, 1] }, // 27 → 23
  { count: 5, points: [5, 4, 3, 2, 1] }, // 22 → 18
  { count: 5, points: [5, 4, 3, 2, 1] }, // 17 → 13
  { count: 4, points: [4, 3, 2, 1] }, //   12 → 9
  { count: 4, points: [4, 3, 2, 1] }, //   8 → 5
  { count: 4, points: [4, 3, 2, 1] }, //   4 → 1
];

export type GlobalRankingEntry = {
  qbId: string;
  finalPosition: number;
  pointsInRound: number;
  roundIndex: number;
};

export type RoundBreakdown = {
  roundIndex: number;
  positionsAssigned: [number, number];
  scores: Array<{ qbId: string; points: number; assigned: boolean }>;
};

export type GlobalRankingResult = {
  ranking: GlobalRankingEntry[];
  totalSubmissions: number;
  rounds: RoundBreakdown[];
};

/**
 * Computes the global ranking using the iterative bottom-up algorithm.
 * `allRankings` is an array of user rankings, each being an ordered array
 * of QB ids from position 1 (best) to position N (worst).
 */
export function computeGlobalRanking(allRankings: string[][]): GlobalRankingResult {
  const orderedWorstFirst: GlobalRankingEntry[] = [];
  const orderedSet = new Set<string>();
  const breakdowns: RoundBreakdown[] = [];

  for (let roundIdx = 0; roundIdx < ROUNDS.length; roundIdx++) {
    const round = ROUNDS[roundIdx];
    const scores = new Map<string, number>();

    for (const ranking of allRankings) {
      const unranked = ranking.filter((qb) => !orderedSet.has(qb));
      const bottomN = unranked.slice(-round.count);
      // bottomN[bottomN.length - 1] = peor del votante → recibe points[0]
      for (let i = 0; i < bottomN.length; i++) {
        const qb = bottomN[bottomN.length - 1 - i];
        scores.set(qb, (scores.get(qb) ?? 0) + round.points[i]);
      }
    }

    const sortedScores = [...scores.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );

    const startPos = 32 - orderedWorstFirst.length;
    const taken = sortedScores.slice(0, round.count);

    for (let i = 0; i < taken.length; i++) {
      const [qbId, points] = taken[i];
      const finalPosition = startPos - i;
      orderedWorstFirst.push({ qbId, finalPosition, pointsInRound: points, roundIndex: roundIdx });
      orderedSet.add(qbId);
    }

    breakdowns.push({
      roundIndex: roundIdx,
      positionsAssigned: [startPos - taken.length + 1, startPos],
      scores: sortedScores.map(([qbId, points]) => ({
        qbId,
        points,
        assigned: orderedSet.has(qbId),
      })),
    });
  }

  const ranking = [...orderedWorstFirst].sort((a, b) => a.finalPosition - b.finalPosition);

  return {
    ranking,
    totalSubmissions: allRankings.length,
    rounds: breakdowns,
  };
}

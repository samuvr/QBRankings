import { sql } from "@vercel/postgres";
import type { VotingId } from "@/data/votings";

export type RankingRow = {
  id: string;
  full_name: string;
  email: string;
  voting: VotingId;
  positions: string[];
  created_at: string;
  updated_at: string;
};

export async function upsertRanking(input: {
  fullName: string;
  email: string;
  voting: VotingId;
  positions: string[];
}): Promise<{ id: string }> {
  const positionsJson = JSON.stringify(input.positions);
  const result = await sql<{ id: string }>`
    INSERT INTO rankings (full_name, email, voting, positions)
    VALUES (${input.fullName}, ${input.email}, ${input.voting}, ${positionsJson}::jsonb)
    ON CONFLICT (email, voting)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      positions = EXCLUDED.positions,
      updated_at = now()
    RETURNING id
  `;
  return { id: result.rows[0].id };
}

export async function getRankingById(id: string): Promise<RankingRow | null> {
  const result = await sql<RankingRow>`
    SELECT id, full_name, email, voting, positions, created_at, updated_at
    FROM rankings
    WHERE id = ${id}
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function getRankingsByVoting(voting: VotingId): Promise<RankingRow[]> {
  const result = await sql<RankingRow>`
    SELECT id, full_name, email, voting, positions, created_at, updated_at
    FROM rankings
    WHERE voting = ${voting}
    ORDER BY created_at ASC
  `;
  return result.rows;
}

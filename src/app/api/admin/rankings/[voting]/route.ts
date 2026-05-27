import { NextResponse } from "next/server";
import { getRankingsByVoting } from "@/lib/db/client";
import { computeGlobalRanking } from "@/lib/ranking-algorithm";
import { isVotingId } from "@/data/votings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ voting: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { voting } = await params;
  if (!isVotingId(voting)) {
    return NextResponse.json({ error: "Unknown voting" }, { status: 404 });
  }

  const rows = await getRankingsByVoting(voting);
  const result = computeGlobalRanking(rows.map((r) => r.positions));

  return NextResponse.json({
    ...result,
    voters: rows.map((r) => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
}

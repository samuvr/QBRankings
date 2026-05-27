import { NextResponse } from "next/server";
import { getRankingsByVoting, getVotingBySlug } from "@/lib/db/client";
import { computeGlobalRanking } from "@/lib/ranking-algorithm";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasVotingAdminAccess } from "@/lib/voting-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ voting: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { voting: slug } = await params;
  const voting = await getVotingBySlug(slug);
  if (!voting) {
    return NextResponse.json({ error: "Unknown voting" }, { status: 404 });
  }

  const isSuper = await isAdminAuthenticated();
  const isVotingAdmin = await hasVotingAdminAccess(voting.id);
  if (!isSuper && !isVotingAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getRankingsByVoting(voting.id);
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

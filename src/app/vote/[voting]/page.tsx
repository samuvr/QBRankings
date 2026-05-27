import { notFound } from "next/navigation";
import { RankingBoard } from "@/components/RankingBoard";
import { VotingAccessGate } from "@/components/VotingAccessGate";
import { isVotingId } from "@/data/votings";
import { hasVotingAccess } from "@/lib/voting-access";

export const dynamic = "force-dynamic";

type Params = Promise<{ voting: string }>;

export default async function VotePage({ params }: { params: Params }) {
  const { voting } = await params;
  if (!isVotingId(voting)) notFound();
  const allowed = await hasVotingAccess(voting);
  if (!allowed) {
    return <VotingAccessGate voting={voting} />;
  }
  return <RankingBoard voting={voting} />;
}

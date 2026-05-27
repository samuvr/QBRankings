import { notFound } from "next/navigation";
import { RankingBoard } from "@/components/RankingBoard";
import { isVotingId } from "@/data/votings";

type Params = Promise<{ voting: string }>;

export default async function VotePage({ params }: { params: Params }) {
  const { voting } = await params;
  if (!isVotingId(voting)) notFound();
  return <RankingBoard voting={voting} />;
}

import { notFound, redirect } from "next/navigation";
import { RankingBoard } from "@/components/RankingBoard";
import { getVotingBySlug } from "@/lib/db/client";
import { hasVoterAccess } from "@/lib/voting-access";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = Promise<{ voting: string }>;

export default async function VotePage({ params }: { params: Params }) {
  const { voting: slug } = await params;
  const voting = await getVotingBySlug(slug);
  if (!voting || !voting.active) notFound();

  const isSuperadmin = await isAdminAuthenticated();
  const isVoter = await hasVoterAccess(voting.id);
  if (!isSuperadmin && !isVoter) {
    redirect(`/vote/${slug}/access`);
  }

  const { voter_password_hash: _v, admin_password_hash: _a, ...publicVoting } = voting;
  void _v;
  void _a;
  return <RankingBoard voting={publicVoting} />;
}

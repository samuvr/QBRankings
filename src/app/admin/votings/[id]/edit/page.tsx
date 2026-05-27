import Link from "next/link";
import { notFound } from "next/navigation";
import { getVotingById } from "@/lib/db/client";
import { VotingForm } from "@/components/VotingForm";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditVotingPage({ params }: { params: Params }) {
  const { id } = await params;
  const voting = await getVotingById(id);
  if (!voting) notFound();

  const { voter_password_hash: _v, admin_password_hash: _a, ...publicVoting } = voting;
  void _v;
  void _a;

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <header className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:underline">
          ← Volver
        </Link>
        <h1 className="mt-2 text-3xl font-black">Editar {voting.name}</h1>
      </header>
      <VotingForm mode="edit" voting={publicVoting} />
    </main>
  );
}

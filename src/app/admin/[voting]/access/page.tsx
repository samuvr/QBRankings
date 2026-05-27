import { notFound, redirect } from "next/navigation";
import { getVotingBySlug } from "@/lib/db/client";
import { hasVotingAdminAccess } from "@/lib/voting-access";
import { isAdminAuthenticated } from "@/lib/auth";
import { VotingAdminLoginForm } from "./VotingAdminLoginForm";

type Params = Promise<{ voting: string }>;

export const dynamic = "force-dynamic";

export default async function VotingAdminAccessPage({ params }: { params: Params }) {
  const { voting: slug } = await params;
  const voting = await getVotingBySlug(slug);
  if (!voting) notFound();

  if (await isAdminAuthenticated()) {
    redirect(`/admin/${slug}`);
  }
  if (await hasVotingAdminAccess(voting.id)) {
    redirect(`/admin/${slug}`);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-10">
      <header className="mb-6 text-center">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: voting.accent }}
        >
          Acceso admin
        </p>
        <h1 className="mt-1 text-3xl font-black">{voting.name}</h1>
        <p className="mt-2 text-sm text-muted">
          Introduce la contraseña de admin para ver este ranking.
        </p>
      </header>
      <VotingAdminLoginForm votingId={voting.id} slug={voting.slug} />
    </main>
  );
}

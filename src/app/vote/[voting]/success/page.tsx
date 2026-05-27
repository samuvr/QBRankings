import Link from "next/link";
import { notFound } from "next/navigation";
import { getRankingById } from "@/lib/db/client";
import { getVoting, isVotingId } from "@/data/votings";
import { ShareActions } from "./ShareActions";

type Params = Promise<{ voting: string }>;
type Search = Promise<{ id?: string }>;

export default async function SuccessPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { voting } = await params;
  const { id } = await searchParams;
  if (!isVotingId(voting) || !id) notFound();
  const ranking = await getRankingById(id);
  if (!ranking || ranking.voting !== voting) notFound();

  const meta = getVoting(voting);
  const imageUrl = `/api/rankings/${id}/image`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-10">
      <header className="mb-6 text-center">
        <p
          className="font-subhead text-xs uppercase tracking-[0.25em]"
          style={{ color: meta.accent }}
        >
          Ranking enviado
        </p>
        <h1 className="font-display mt-2 text-4xl uppercase leading-tight">
          ¡Listo, {ranking.full_name.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Tu top 32 está guardado en {meta.name}. Descarga la imagen y compártela.
        </p>
      </header>

      <div className="w-full overflow-hidden rounded-2xl border border-border bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Ranking de ${ranking.full_name}`}
          className="block w-full"
          loading="eager"
        />
      </div>

      <ShareActions imageUrl={imageUrl} fullName={ranking.full_name} votingName={meta.name} />

      <Link
        href="/"
        className="mt-8 text-xs text-muted underline-offset-2 hover:underline"
      >
        Volver al inicio
      </Link>
    </main>
  );
}

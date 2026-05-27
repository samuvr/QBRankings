import Link from "next/link";
import { notFound } from "next/navigation";
import { getRankingsByVoting } from "@/lib/db/client";
import { computeGlobalRanking } from "@/lib/ranking-algorithm";
import { getAllQbs, getQbById } from "@/data/qbs";
import { getTeamByAbbr } from "@/data/teams";
import { getVoting, isVotingId, VOTINGS } from "@/data/votings";
import { TeamMark } from "@/components/TeamMark";

export const dynamic = "force-dynamic";

type Params = Promise<{ voting: string }>;

export default async function AdminDashboardPage({ params }: { params: Params }) {
  const { voting } = await params;
  if (!isVotingId(voting)) notFound();

  const meta = getVoting(voting);
  const rows = await getRankingsByVoting(voting);
  const result = computeGlobalRanking(rows.map((r) => r.positions));
  const qbCount = getAllQbs().length;

  const otherVoting = Object.values(VOTINGS).find((v) => v.id !== voting)!;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: meta.accent }}>
            Ranking global
          </p>
          <h1 className="text-3xl font-black">{meta.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {result.totalSubmissions} envíos · {qbCount} QBs ordenados en 7 rondas
          </p>
        </div>
        <Link
          href={`/admin/${otherVoting.id}`}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold transition hover:border-muted"
        >
          Ver {otherVoting.shortName} →
        </Link>
      </header>

      {result.totalSubmissions === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Todavía no hay envíos en esta votación.
        </div>
      ) : (
        <>
          <section aria-label="Ranking">
            <ol className="space-y-2">
              {result.ranking.map((entry) => {
                const qb = getQbById(entry.qbId);
                const team = qb ? getTeamByAbbr(qb.teamAbbr) : null;
                return (
                  <li
                    key={entry.qbId}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
                  >
                    <div className="w-10 text-right font-mono text-lg font-bold text-muted">
                      {entry.finalPosition.toString().padStart(2, "0")}
                    </div>
                    {team && <TeamMark abbr={qb!.teamAbbr} size={36} />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{qb?.name ?? entry.qbId}</p>
                      <p className="truncate text-xs text-muted">
                        {qb?.teamAbbr} · ronda {entry.roundIndex + 1} · {entry.pointsInRound} pts
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="mt-10" aria-label="Votantes">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Votantes ({rows.length})
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.full_name}</p>
                    <p className="truncate text-muted">{r.email}</p>
                  </div>
                  <span className="text-muted">{new Date(r.updated_at).toLocaleString("es-ES")}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}

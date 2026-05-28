"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { getQbById } from "@/data/qbs";
import { getTeamByAbbr } from "@/data/teams";
import { TeamMark } from "@/components/TeamMark";
import type { VotingPublic } from "@/lib/db/client";
import type { GlobalRankingResult } from "@/lib/ranking-algorithm";

type Mode = "list" | "stream";

type Voter = {
  id: string;
  fullName: string;
  email: string;
  updatedAt: string;
};

type Props = {
  voting: VotingPublic;
  result: GlobalRankingResult;
  initialMode: Mode;
  initialRound: number;
  voters: Voter[];
};

export function AdminRankingView({
  voting,
  result,
  initialMode,
  initialRound,
  voters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [round, setRound] = useState(initialRound);

  const totalRounds = result.rounds.length;

  const syncUrl = useCallback(
    (m: Mode, r: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (m === "stream") {
        params.set("mode", "stream");
        params.set("round", String(r));
      } else {
        params.delete("mode");
        params.delete("round");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setModeAndSync = (m: Mode) => {
    setMode(m);
    syncUrl(m, round);
  };
  const setRoundAndSync = (r: number) => {
    setRound(r);
    syncUrl(mode, r);
  };

  // Teclado: flechas izquierda/derecha en modo stream
  useEffect(() => {
    if (mode !== "stream") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && round > 0) setRoundAndSync(round - 1);
      if (e.key === "ArrowRight" && round < totalRounds - 1) setRoundAndSync(round + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, round, totalRounds]);

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "list"}
          onClick={() => setModeAndSync("list")}
          className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "list" ? "bg-surface-2 text-foreground" : "text-muted"
          }`}
        >
          Lista completa
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "stream"}
          onClick={() => setModeAndSync("stream")}
          className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "stream" ? "bg-surface-2 text-foreground" : "text-muted"
          }`}
        >
          Stream por fases
        </button>
      </div>

      {mode === "list" ? (
        <RankingList result={result} />
      ) : (
        <RankingStream
          result={result}
          round={round}
          totalRounds={totalRounds}
          accent={voting.accent}
          onPrev={() => setRoundAndSync(Math.max(0, round - 1))}
          onNext={() => setRoundAndSync(Math.min(totalRounds - 1, round + 1))}
        />
      )}

      <section aria-label="Votantes">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Votantes ({voters.length})
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {voters.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{v.fullName}</p>
                <p className="truncate text-muted">{v.email}</p>
              </div>
              <span className="text-muted">
                {new Date(v.updatedAt).toLocaleString("es-ES")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RankingList({ result }: { result: GlobalRankingResult }) {
  const historyByQb = useMemo(() => {
    const map = new Map<string, Array<{ roundIndex: number; points: number }>>();
    for (const round of result.rounds) {
      for (const score of round.scores) {
        if (score.points <= 0) continue;
        const arr = map.get(score.qbId) ?? [];
        arr.push({ roundIndex: round.roundIndex, points: score.points });
        map.set(score.qbId, arr);
      }
    }
    return map;
  }, [result.rounds]);

  return (
    <ol className="space-y-2">
      {result.ranking.map((entry) => {
        const qb = getQbById(entry.qbId);
        const team = qb ? getTeamByAbbr(qb.teamAbbr) : null;
        const history = historyByQb.get(entry.qbId) ?? [];
        return (
          <li
            key={entry.qbId}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
          >
            <div className="w-10 text-right font-mono text-lg font-bold text-muted">
              {entry.finalPosition.toString().padStart(2, "0")}
            </div>
            {team && qb && <TeamMark abbr={qb.teamAbbr} size={36} />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{qb?.name ?? entry.qbId}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                <span>
                  {qb?.teamAbbr} · ronda {entry.roundIndex + 1} · {entry.pointsInRound} pts
                </span>
                {history.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1">
                    {history.map((h) => {
                      const isElim = h.roundIndex === entry.roundIndex;
                      return (
                        <span
                          key={h.roundIndex}
                          className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${
                            isElim
                              ? "border-foreground/40 bg-surface-2 text-foreground"
                              : "border-border"
                          }`}
                          title={`Ronda ${h.roundIndex + 1}: ${h.points} pts`}
                        >
                          R{h.roundIndex + 1}:{h.points}
                        </span>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RankingStream({
  result,
  round,
  totalRounds,
  accent,
  onPrev,
  onNext,
}: {
  result: GlobalRankingResult;
  round: number;
  totalRounds: number;
  accent: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const breakdown = result.rounds[round];
  // Entries asignadas en esta ronda, ordenadas de peor (mayor finalPosition) a mejor.
  const entries = useMemo(
    () =>
      [...result.ranking]
        .filter((e) => e.roundIndex === round)
        .sort((a, b) => b.finalPosition - a.finalPosition),
    [result.ranking, round],
  );
  const historyByQb = useMemo(() => {
    const map = new Map<string, Array<{ roundIndex: number; points: number }>>();
    for (const r of result.rounds) {
      for (const score of r.scores) {
        if (score.points <= 0) continue;
        const arr = map.get(score.qbId) ?? [];
        arr.push({ roundIndex: r.roundIndex, points: score.points });
        map.set(score.qbId, arr);
      }
    }
    return map;
  }, [result.rounds]);

  const [low, high] = breakdown.positionsAssigned;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={round === 0}
          aria-label="Fase anterior"
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-muted disabled:opacity-30"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Fase {round + 1} de {totalRounds}
          </p>
          <p
            className="font-mono text-2xl font-black"
            style={{ color: accent }}
          >
            Puestos {low}-{high}
          </p>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={round === totalRounds - 1}
          aria-label="Siguiente fase"
          className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-muted disabled:opacity-30"
        >
          →
        </button>
      </div>

      <ol className="space-y-2">
        {entries.map((entry) => {
          const qb = getQbById(entry.qbId);
          const team = qb ? getTeamByAbbr(qb.teamAbbr) : null;
          const history = historyByQb.get(entry.qbId) ?? [];
          return (
            <li
              key={entry.qbId}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="w-12 text-right font-mono text-2xl font-black">
                {entry.finalPosition.toString().padStart(2, "0")}
              </div>
              {team && qb && <TeamMark abbr={qb.teamAbbr} size={44} />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{qb?.name ?? entry.qbId}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span>
                    {qb?.teamAbbr} · {entry.pointsInRound} pts
                  </span>
                  {history.length > 0 && (
                    <span className="flex flex-wrap items-center gap-1">
                      {history.map((h) => {
                        const isElim = h.roundIndex === entry.roundIndex;
                        return (
                          <span
                            key={h.roundIndex}
                            className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${
                              isElim
                                ? "border-foreground/40 bg-surface-2 text-foreground"
                                : "border-border"
                            }`}
                            title={`Ronda ${h.roundIndex + 1}: ${h.points} pts`}
                          >
                            R{h.roundIndex + 1}:{h.points}
                          </span>
                        );
                      })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: totalRounds }, (_, i) => (
          <span
            key={i}
            className="h-1.5 w-6 rounded-full"
            style={{
              background: i === round ? accent : "var(--color-surface-2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

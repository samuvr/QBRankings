"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllQbs, getQbById, TOTAL_QBS, type Qb } from "@/data/qbs";
import { getVoting, type VotingId } from "@/data/votings";
import { QbCard } from "./QbCard";
import { RankingSlot } from "./RankingSlot";

type Tab = "pool" | "ranking";

type StoredProgress = {
  fullName: string;
  email: string;
  positions: (string | null)[];
};

const storageKey = (voting: VotingId) => `qbr:progress:${voting}`;
const userDataKey = "qbr:user";

type Props = { voting: VotingId };

export function RankingBoard({ voting }: Props) {
  const router = useRouter();
  const allQbs = useMemo(() => getAllQbs(), []);
  const votingMeta = getVoting(voting);

  const [positions, setPositions] = useState<(string | null)[]>(
    () => Array.from({ length: TOTAL_QBS }, () => null),
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<Tab>("pool");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from sessionStorage (user data) + localStorage (progress)
  useEffect(() => {
    try {
      const user = sessionStorage.getItem(userDataKey);
      if (user) {
        const parsed = JSON.parse(user) as { fullName?: string; email?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.email) setEmail(parsed.email);
      }
      const stored = localStorage.getItem(storageKey(voting));
      if (stored) {
        const parsed = JSON.parse(stored) as StoredProgress;
        if (Array.isArray(parsed.positions) && parsed.positions.length === TOTAL_QBS) {
          setPositions(parsed.positions);
        }
        if (parsed.fullName) setFullName((cur) => cur || parsed.fullName);
        if (parsed.email) setEmail((cur) => cur || parsed.email);
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, [voting]);

  // Persist progress
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: StoredProgress = { fullName, email, positions };
      localStorage.setItem(storageKey(voting), JSON.stringify(payload));
    } catch {
      // ignore quota errors
    }
  }, [voting, positions, fullName, email, hydrated]);

  const placedSet = useMemo(() => new Set(positions.filter((v): v is string => !!v)), [positions]);
  const pool = useMemo(() => allQbs.filter((q) => !placedSet.has(q.id)), [allQbs, placedSet]);
  const placedCount = positions.length - pool.length;
  const complete = placedCount === TOTAL_QBS;

  const placeQb = useCallback((qbId: string) => {
    setPositions((cur) => {
      const idx = cur.findIndex((v) => v === null);
      if (idx === -1) return cur;
      const next = [...cur];
      next[idx] = qbId;
      return next;
    });
    setTab("ranking");
  }, []);

  const swap = useCallback((a: number, b: number) => {
    setPositions((cur) => {
      if (a < 0 || b < 0 || a >= cur.length || b >= cur.length) return cur;
      const next = [...cur];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }, []);

  const removeAt = useCallback((index: number) => {
    setPositions((cur) => {
      // Remove the item and compact: keep others in order, leaving null at the end
      const next = cur.filter((_, i) => i !== index);
      next.push(null);
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Introduce tu nombre completo");
      return;
    }
    if (!email.includes("@")) {
      setError("Introduce un email válido");
      return;
    }
    if (!complete) {
      setError("Tienes que colocar a los 32 QBs");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rankings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          voting,
          positions: positions as string[],
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      const data = (await res.json()) as { id: string };
      try {
        localStorage.removeItem(storageKey(voting));
        sessionStorage.setItem(userDataKey, JSON.stringify({ fullName, email }));
      } catch {
        // ignore
      }
      router.push(`/vote/${voting}/success?id=${data.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error enviando ranking";
      setError(msg);
      setSubmitting(false);
    }
  }, [complete, email, fullName, positions, router, voting]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-3 backdrop-blur"
        style={{ borderColor: votingMeta.accent }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white"
              style={{ background: votingMeta.accent }}
            >
              {votingMeta.shortName}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Votación</p>
              <p className="text-sm font-semibold leading-tight">{votingMeta.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Progreso</p>
            <p className="font-mono text-sm font-bold">
              {placedCount.toString().padStart(2, "0")} / {TOTAL_QBS}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-2 max-w-3xl">
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full transition-all"
              style={{
                width: `${(placedCount / TOTAL_QBS) * 100}%`,
                background: votingMeta.accent,
              }}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {/* User identity */}
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-xl border border-border bg-surface p-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="mb-1 block text-muted">Nombre completo</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>
          <label className="text-xs">
            <span className="mb-1 block text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-foreground"
              placeholder="tu@email.com"
              autoComplete="email"
              inputMode="email"
            />
          </label>
        </div>

        {/* Tabs (mobile) */}
        <div className="mb-3 grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface lg:hidden">
          <button
            type="button"
            onClick={() => setTab("pool")}
            className={`px-3 py-2 text-sm font-semibold transition ${
              tab === "pool" ? "bg-surface-2 text-foreground" : "text-muted"
            }`}
          >
            Disponibles · {pool.length}
          </button>
          <button
            type="button"
            onClick={() => setTab("ranking")}
            className={`px-3 py-2 text-sm font-semibold transition ${
              tab === "ranking" ? "bg-surface-2 text-foreground" : "text-muted"
            }`}
          >
            Mi ranking · {placedCount}/{TOTAL_QBS}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Pool */}
          <section
            className={`${tab === "pool" ? "block" : "hidden"} lg:block`}
            aria-label="QBs disponibles"
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Toca un QB para añadirlo al siguiente puesto vacío
            </h2>
            <ul className="space-y-2">
              {pool.length === 0 && (
                <li className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
                  Has colocado a todos los QBs.
                </li>
              )}
              {pool.map((qb) => (
                <li key={qb.id}>
                  <QbCard qb={qb} onTap={() => placeQb(qb.id)} />
                </li>
              ))}
            </ul>
          </section>

          {/* Ranking */}
          <section
            className={`${tab === "ranking" ? "block" : "hidden"} lg:block`}
            aria-label="Mi ranking"
          >
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Tu ranking (1 = mejor, 32 = peor)
            </h2>
            <ol className="space-y-2">
              {positions.map((qbId, idx) => {
                const qb: Qb | null = qbId ? getQbById(qbId) ?? null : null;
                return (
                  <li key={idx}>
                    <RankingSlot
                      position={idx + 1}
                      qb={qb}
                      canMoveUp={idx > 0 && !!qb}
                      canMoveDown={idx < TOTAL_QBS - 1 && !!qb && !!positions[idx + 1]}
                      onMoveUp={() => swap(idx, idx - 1)}
                      onMoveDown={() => swap(idx, idx + 1)}
                      onRemove={() => removeAt(idx)}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>

      {/* Sticky submit */}
      <footer className="sticky bottom-0 z-10 border-t border-border bg-background/95 px-4 py-3 safe-bottom backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {error && (
            <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!complete || submitting}
            className="w-full rounded-xl px-4 py-3 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: votingMeta.accent }}
          >
            {submitting ? "Enviando…" : complete ? "Enviar ranking" : `Coloca a los ${TOTAL_QBS - placedCount} restantes`}
          </button>
        </div>
      </footer>
    </div>
  );
}

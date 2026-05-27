"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getVoting, type VotingId } from "@/data/votings";

type Props = { voting: VotingId };

export function VotingAccessGate({ voting }: Props) {
  const router = useRouter();
  const meta = getVoting(voting);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/voting/${voting}/access`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-10">
      <header className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div
            className="relative h-20 w-20 overflow-hidden rounded-full border-2"
            style={{ borderColor: meta.accent }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meta.logoUrl}
              alt={meta.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <p
          className="font-subhead text-xs uppercase tracking-[0.25em]"
          style={{ color: meta.accent }}
        >
          Acceso restringido
        </p>
        <h1 className="font-display mt-1 text-4xl uppercase leading-tight">
          {meta.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Introduce la contraseña de la votación para empezar tu ranking.
        </p>
      </header>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none transition focus:border-foreground"
          placeholder="Contraseña"
          autoComplete="current-password"
          autoFocus
          required
        />
        {error && (
          <p className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="font-subhead rounded-xl px-4 py-3 text-base uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-50"
          style={{ background: meta.accent }}
        >
          {busy ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}

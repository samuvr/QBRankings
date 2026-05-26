"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VotingSelector } from "@/components/VotingSelector";
import { type VotingId } from "@/data/votings";

export default function Home() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [voting, setVoting] = useState<VotingId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("qbr:user");
      if (stored) {
        const parsed = JSON.parse(stored) as { fullName?: string; email?: string };
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) {
      setError("Introduce tu nombre completo");
      return;
    }
    if (!email.includes("@")) {
      setError("Introduce un email válido");
      return;
    }
    if (!voting) {
      setError("Elige una votación");
      return;
    }
    try {
      sessionStorage.setItem(
        "qbr:user",
        JSON.stringify({ fullName: fullName.trim(), email: email.trim() }),
      );
    } catch {
      // ignore
    }
    router.push(`/vote/${voting}`);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <header className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-muted">Temporada 2026</p>
        <h1 className="text-4xl font-black tracking-tight">QB Rankings</h1>
        <p className="mt-3 text-sm text-muted">
          Ordena tu top 32 de QBs titulares y participa en la votación.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Nombre completo
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-foreground"
            placeholder="Tu nombre"
            autoComplete="name"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-foreground"
            placeholder="tu@email.com"
            autoComplete="email"
            inputMode="email"
            required
          />
        </label>

        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
            Votación
          </span>
          <VotingSelector value={voting} onChange={setVoting} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <button
          type="submit"
          className="mt-2 rounded-xl bg-foreground px-4 py-3 text-base font-bold text-background transition active:scale-[0.98] hover:opacity-90"
        >
          Empezar ranking
        </button>
      </form>

      <footer className="mt-10 text-center text-xs text-muted">
        Reenviar con el mismo email sobrescribe tu ranking anterior.
      </footer>
    </main>
  );
}

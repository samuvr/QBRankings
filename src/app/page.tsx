import Image from "next/image";
import { getActiveVotings } from "@/lib/db/client";
import { HomeForm } from "./HomeForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const votings = await getActiveVotings();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
      <header className="mb-8 text-center">
        <div className="mb-5 flex justify-center">
          <Image
            src="/nfl-alicante.jpg"
            alt="NFL Alicante"
            width={96}
            height={96}
            className="rounded-full border-2"
            style={{ borderColor: "var(--foreground)" }}
            priority
          />
        </div>
        <p className="font-subhead text-xs uppercase tracking-[0.25em] text-muted">
          Temporada 2026
        </p>
        <h1 className="mt-2 font-display text-6xl uppercase leading-[0.95]">QB Rankings</h1>
        <p className="mt-3 text-sm text-muted">
          Elige tus favoritos y ayuda a crear el ranking global de tu comunidad.
        </p>
      </header>

      <HomeForm votings={votings} />

      <footer className="mt-10 text-center text-xs text-muted">
        Reenviar con el mismo email sobrescribe tu ranking anterior.
      </footer>
    </main>
  );
}

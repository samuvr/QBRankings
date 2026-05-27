import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAllVotingsForAdmin, getRankingsCountByVoting } from "@/lib/db/client";
import { LoginForm } from "./LoginForm";
import { VotingsManager } from "@/components/VotingsManager";

type Search = Promise<{ next?: string }>;

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-10">
        <header className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Panel</p>
          <h1 className="mt-1 text-3xl font-black">Admin</h1>
          <p className="mt-2 text-sm text-muted">Introduce la contraseña para acceder.</p>
        </header>
        <LoginForm nextPath={next ?? "/admin"} />
      </main>
    );
  }

  const [votings, counts] = await Promise.all([
    getAllVotingsForAdmin(),
    getRankingsCountByVoting(),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Panel</p>
          <h1 className="text-3xl font-black">Votaciones</h1>
          <p className="mt-1 text-sm text-muted">
            Gestiona votaciones, contraseñas y consulta los rankings globales.
          </p>
        </div>
        <Link
          href="/admin/votings/new"
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-bold text-background transition hover:opacity-90"
        >
          + Nueva votación
        </Link>
      </header>

      <VotingsManager initialVotings={votings} counts={counts} />
    </main>
  );
}

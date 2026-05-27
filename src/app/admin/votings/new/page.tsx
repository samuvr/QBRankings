import Link from "next/link";
import { VotingForm } from "@/components/VotingForm";

export const dynamic = "force-dynamic";

export default function NewVotingPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <header className="mb-6">
        <Link href="/admin" className="text-xs text-muted hover:underline">
          ← Volver
        </Link>
        <h1 className="mt-2 text-3xl font-black">Nueva votación</h1>
      </header>
      <VotingForm mode="create" />
    </main>
  );
}

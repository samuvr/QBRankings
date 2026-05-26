import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

type Search = Promise<{ next?: string }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: Search }) {
  const { next } = await searchParams;
  if (await isAdminAuthenticated()) {
    redirect(next && next.startsWith("/admin/") ? next : "/admin/nfl_alicante");
  }
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-10">
      <header className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Panel</p>
        <h1 className="mt-1 text-3xl font-black">Admin</h1>
        <p className="mt-2 text-sm text-muted">Introduce la contraseña para acceder.</p>
      </header>
      <LoginForm nextPath={next ?? "/admin/nfl_alicante"} />
    </main>
  );
}

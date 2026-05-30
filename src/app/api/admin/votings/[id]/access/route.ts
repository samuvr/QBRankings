import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PasswordRequiredSchema } from "@/lib/schemas";
import { getVotingById } from "@/lib/db/client";
import { setVotingAdminCookie, verifyPassword } from "@/lib/voting-access";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data;
  try {
    data = PasswordRequiredSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    throw err;
  }

  const voting = await getVotingById(id);
  if (!voting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await verifyPassword(data.password, voting.admin_password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  await setVotingAdminCookie(voting.id);
  return NextResponse.json({ ok: true });
}

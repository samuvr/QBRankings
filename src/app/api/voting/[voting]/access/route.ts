import { NextResponse } from "next/server";
import { isVotingId } from "@/data/votings";
import { checkVotingPassword, grantVotingAccess } from "@/lib/voting-access";

export const runtime = "nodejs";

type Params = Promise<{ voting: string }>;

export async function POST(req: Request, { params }: { params: Params }) {
  const { voting } = await params;
  if (!isVotingId(voting)) {
    return NextResponse.json({ error: "Unknown voting" }, { status: 404 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = typeof body.password === "string" ? body.password : "";
  if (!checkVotingPassword(voting, input)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  await grantVotingAccess(voting);
  return NextResponse.json({ ok: true });
}

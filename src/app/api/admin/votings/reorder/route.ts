import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { VotingReorderSchema } from "@/lib/schemas";
import { reorderVotings } from "@/lib/db/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data;
  try {
    data = VotingReorderSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    throw err;
  }

  await reorderVotings(data.orderedIds);
  return NextResponse.json({ ok: true });
}

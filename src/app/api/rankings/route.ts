import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RankingSubmissionSchema } from "@/lib/schemas";
import { upsertRanking } from "@/lib/db/client";

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
    data = RankingSubmissionSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  try {
    const { id } = await upsertRanking(data);
    return NextResponse.json({ id });
  } catch (err) {
    console.error("Failed to upsert ranking", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

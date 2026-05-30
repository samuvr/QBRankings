import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { VotingCreateSchema } from "@/lib/schemas";
import { createVoting, getAllVotingsForAdmin, getVotingBySlug } from "@/lib/db/client";
import { hashPassword } from "@/lib/voting-access";

export const runtime = "nodejs";

export async function GET() {
  const votings = await getAllVotingsForAdmin();
  return NextResponse.json({ votings });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data;
  try {
    data = VotingCreateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  const existing = await getVotingBySlug(data.slug);
  if (existing) {
    return NextResponse.json({ error: "Slug ya en uso" }, { status: 409 });
  }

  const isPublic = data.publicAccess ?? false;

  if (!isPublic && !data.voterPassword) {
    return NextResponse.json(
      { error: "La contraseña de votante es obligatoria en votaciones no públicas" },
      { status: 400 },
    );
  }

  const [voterPasswordHash, adminPasswordHash] = await Promise.all([
    isPublic && !data.voterPassword
      ? hashPassword(crypto.randomUUID())
      : hashPassword(data.voterPassword!),
    hashPassword(data.adminPassword),
  ]);

  const { id } = await createVoting({
    slug: data.slug,
    name: data.name,
    shortName: data.shortName,
    description: data.description,
    accent: data.accent,
    accentDark: data.accentDark,
    logoUrl: data.logoUrl,
    voterPasswordHash,
    adminPasswordHash,
    publicAccess: isPublic,
  });

  return NextResponse.json({ id });
}

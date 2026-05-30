import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { VotingUpdateSchema } from "@/lib/schemas";
import { getVotingById, getVotingBySlug, updateVoting } from "@/lib/db/client";
import { hashPassword } from "@/lib/voting-access";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data;
  try {
    data = VotingUpdateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }

  const current = await getVotingById(id);
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (data.slug && data.slug !== current.slug) {
    const other = await getVotingBySlug(data.slug);
    if (other && other.id !== id) {
      return NextResponse.json({ error: "Slug ya en uso" }, { status: 409 });
    }
  }

  const [voterPasswordHash, adminPasswordHash] = await Promise.all([
    data.voterPassword ? hashPassword(data.voterPassword) : Promise.resolve(undefined),
    data.adminPassword ? hashPassword(data.adminPassword) : Promise.resolve(undefined),
  ]);

  await updateVoting(id, {
    slug: data.slug,
    name: data.name,
    shortName: data.shortName,
    description: data.description,
    accent: data.accent,
    accentDark: data.accentDark,
    logoUrl: data.logoUrl,
    active: data.active,
    publicAccess: data.publicAccess,
    voterPasswordHash,
    adminPasswordHash,
  });

  return NextResponse.json({ ok: true });
}

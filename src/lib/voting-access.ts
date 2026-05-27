import { cookies } from "next/headers";
import { type VotingId } from "@/data/votings";

const COOKIE_PREFIX = "voting_access_";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

function envKey(votingId: VotingId): string {
  return `VOTING_PASSWORD_${votingId.toUpperCase()}`;
}

export function getVotingPassword(votingId: VotingId): string | undefined {
  const raw = process.env[envKey(votingId)];
  if (!raw || raw.trim().length === 0) return undefined;
  return raw;
}

export function votingRequiresPassword(votingId: VotingId): boolean {
  return !!getVotingPassword(votingId);
}

export function checkVotingPassword(votingId: VotingId, input: string): boolean {
  const expected = getVotingPassword(votingId);
  if (!expected) return true; // sin password configurada = libre
  if (typeof input !== "string" || input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function hasVotingAccess(votingId: VotingId): Promise<boolean> {
  if (!votingRequiresPassword(votingId)) return true;
  const store = await cookies();
  return !!store.get(`${COOKIE_PREFIX}${votingId}`)?.value;
}

export async function grantVotingAccess(votingId: VotingId): Promise<void> {
  const store = await cookies();
  store.set({
    name: `${COOKIE_PREFIX}${votingId}`,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

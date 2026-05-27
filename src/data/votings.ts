export const VOTING_IDS = ["nfl_alicante", "el_capologist"] as const;
export type VotingId = (typeof VOTING_IDS)[number];

export type Voting = {
  id: VotingId;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  accentDark: string;
  logoUrl: string;
};

export const VOTINGS: Record<VotingId, Voting> = {
  nfl_alicante: {
    id: "nfl_alicante",
    name: "NFL Alicante",
    shortName: "NFLA",
    description: "Comunidad NFL Alicante",
    accent: "#D81E2C",
    accentDark: "#8C0F1A",
    logoUrl: "/nfl-alicante.jpg",
  },
  el_capologist: {
    id: "el_capologist",
    name: "El Capologist",
    shortName: "CAPO",
    description: "El podcast más interactivo",
    accent: "#1F7AE0",
    accentDark: "#0F3F73",
    logoUrl: "/capologist.jpg",
  },
};

export function isVotingId(value: string): value is VotingId {
  return (VOTING_IDS as readonly string[]).includes(value);
}

export function getVoting(id: VotingId): Voting {
  return VOTINGS[id];
}

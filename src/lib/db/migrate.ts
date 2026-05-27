import { config } from "dotenv";
config({ path: ".env.local" });

import { randomBytes } from "node:crypto";
import { sql } from "@vercel/postgres";
import bcrypt from "bcryptjs";

const NFL_ALICANTE_ID = "11111111-1111-1111-1111-111111111111";
const EL_CAPOLOGIST_ID = "22222222-2222-2222-2222-222222222222";

type SeedDescriptor = {
  id: string;
  legacy: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  accent: string;
  accentDark: string;
  logoUrl: string;
  position: number;
};

const LEGACY_SEEDS: SeedDescriptor[] = [
  {
    id: NFL_ALICANTE_ID,
    legacy: "nfl_alicante",
    slug: "nfl-alicante",
    name: "NFL Alicante",
    shortName: "NFLA",
    description: "Comunidad NFL de Alicante",
    accent: "#D81E2C",
    accentDark: "#8C0F1A",
    logoUrl: "/nfl-alicante.jpg",
    position: 0,
  },
  {
    id: EL_CAPOLOGIST_ID,
    legacy: "el_capologist",
    slug: "el-capologist",
    name: "El Capologist",
    shortName: "CAPO",
    description: "Análisis cap y rosters",
    accent: "#1F7AE0",
    accentDark: "#0F3F73",
    logoUrl: "/capologist.jpg",
    position: 1,
  },
];

async function ensureVotingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS votings (
      id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug                  TEXT UNIQUE NOT NULL,
      name                  TEXT NOT NULL,
      short_name            TEXT NOT NULL,
      description           TEXT NOT NULL,
      accent                TEXT NOT NULL,
      accent_dark           TEXT NOT NULL,
      logo_url              TEXT NOT NULL,
      voter_password_hash   TEXT NOT NULL,
      admin_password_hash   TEXT NOT NULL,
      position              INT NOT NULL DEFAULT 0,
      active                BOOLEAN NOT NULL DEFAULT TRUE,
      created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS votings_position_idx ON votings (position);`;
}

async function ensureRankingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS rankings (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name   TEXT NOT NULL,
      email       TEXT NOT NULL,
      voting      UUID NOT NULL REFERENCES votings(id) ON DELETE RESTRICT,
      positions   JSONB NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (email, voting)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS rankings_voting_idx ON rankings (voting);`;
}

async function rankingsTableExists(): Promise<boolean> {
  const r = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'rankings'
    ) AS exists;
  `;
  return r.rows[0].exists;
}

async function rankingsVotingType(): Promise<string | null> {
  const r = await sql<{ data_type: string; udt_name: string }>`
    SELECT data_type, udt_name FROM information_schema.columns
    WHERE table_name = 'rankings' AND column_name = 'voting';
  `;
  const row = r.rows[0];
  if (!row) return null;
  return row.data_type === "USER-DEFINED" ? row.udt_name : row.data_type;
}

async function votingsTableEmpty(): Promise<boolean> {
  const r = await sql<{ count: string }>`SELECT COUNT(*)::text AS count FROM votings;`;
  return r.rows[0].count === "0";
}

async function seedLegacyVotings(): Promise<Array<{ name: string; placeholder: string }>> {
  const generated: Array<{ name: string; placeholder: string }> = [];
  for (const seed of LEGACY_SEEDS) {
    const voterPwd = randomBytes(6).toString("hex");
    const adminPwd = randomBytes(6).toString("hex");
    const voterHash = await bcrypt.hash(voterPwd, 10);
    const adminHash = await bcrypt.hash(adminPwd, 10);
    await sql`
      INSERT INTO votings
        (id, slug, name, short_name, description, accent, accent_dark, logo_url,
         voter_password_hash, admin_password_hash, position, active)
      VALUES
        (${seed.id}, ${seed.slug}, ${seed.name}, ${seed.shortName}, ${seed.description},
         ${seed.accent}, ${seed.accentDark}, ${seed.logoUrl}, ${voterHash}, ${adminHash},
         ${seed.position}, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `;
    generated.push({
      name: seed.name,
      placeholder: `voter=${voterPwd}  admin=${adminPwd}`,
    });
  }
  return generated;
}

async function migrateLegacyRankings() {
  console.log("Migrating legacy rankings.voting (voting_type) → UUID FK…");
  await sql`ALTER TABLE rankings DROP CONSTRAINT IF EXISTS rankings_email_voting_key;`;
  await sql`DROP INDEX IF EXISTS rankings_voting_idx;`;
  await sql`ALTER TABLE rankings ADD COLUMN IF NOT EXISTS voting_id UUID;`;
  for (const seed of LEGACY_SEEDS) {
    await sql`
      UPDATE rankings SET voting_id = ${seed.id}
      WHERE voting_id IS NULL AND voting::text = ${seed.legacy};
    `;
  }
  await sql`DELETE FROM rankings WHERE voting_id IS NULL;`;
  await sql`ALTER TABLE rankings ALTER COLUMN voting_id SET NOT NULL;`;
  await sql`
    ALTER TABLE rankings
      ADD CONSTRAINT rankings_voting_id_fkey
      FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE RESTRICT;
  `;
  await sql`ALTER TABLE rankings DROP COLUMN voting;`;
  await sql`ALTER TABLE rankings RENAME COLUMN voting_id TO voting;`;
  await sql`ALTER TABLE rankings ADD CONSTRAINT rankings_email_voting_key UNIQUE (email, voting);`;
  await sql`CREATE INDEX IF NOT EXISTS rankings_voting_idx ON rankings (voting);`;
  await sql`DROP TYPE IF EXISTS voting_type;`;
}

async function migrate() {
  console.log("Running migrations…");

  const hadRankings = await rankingsTableExists();
  const legacyVoting = hadRankings ? await rankingsVotingType() : null;
  const isLegacy = legacyVoting === "voting_type";

  await ensureVotingsTable();

  let generated: Array<{ name: string; placeholder: string }> = [];
  if (await votingsTableEmpty()) {
    generated = await seedLegacyVotings();
  }

  if (!hadRankings) {
    await ensureRankingsTable();
  } else if (isLegacy) {
    await migrateLegacyRankings();
  }

  console.log("Migrations complete.");
  if (generated.length > 0) {
    console.log("\n⚠️  Seeded legacy votings with placeholder passwords. CHANGE THEM:");
    for (const g of generated) {
      console.log(`  ${g.name}: ${g.placeholder}`);
    }
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

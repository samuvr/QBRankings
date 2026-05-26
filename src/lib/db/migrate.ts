import { sql } from "@vercel/postgres";

async function migrate() {
  console.log("Running migrations…");

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voting_type') THEN
        CREATE TYPE voting_type AS ENUM ('nfl_alicante', 'el_capologist');
      END IF;
    END
    $$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS rankings (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name   TEXT        NOT NULL,
      email       TEXT        NOT NULL,
      voting      voting_type NOT NULL,
      positions   JSONB       NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (email, voting)
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS rankings_voting_idx ON rankings (voting);`;

  console.log("Migrations complete.");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

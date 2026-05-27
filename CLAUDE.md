# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 16 (App Router) webapp for crowdsourced NFL 2026 QB rankings. Users submit a top-32 ordering per voting; admins view a global ranking computed from all submissions.

## Common commands

```
npm run dev          # http://localhost:3000
npm run build        # production build (use to verify type/route correctness)
npm run lint         # eslint
npm test             # vitest (currently only ranking-algorithm.test.ts)
npm run test:watch
npm run db:migrate   # idempotent — creates/migrates votings + rankings tables
```

`db:migrate` uses `tsx --env-file=.env.local`. On Vercel Postgres, copy `POSTGRES_URL` from the dashboard into `.env.local` before running. The first run of the migration seeds two legacy votings with **random bcrypt-hashed passwords printed to stdout** — capture them, then change via `/admin` UI.

## Architecture

### Three independent auth roles (all JWT cookies via `jose`, same `SESSION_SECRET`)

1. **Superadmin** — global `admin_session` cookie. Created by `POST /api/admin/login` (checks `ADMIN_PASSWORD` env var). See `src/lib/auth.ts`.
2. **Voting admin** — per-voting `voting_admin_<uuid>` cookie. Grants read access to a single voting's ranking. See `src/lib/voting-access.ts`.
3. **Voter** — per-voting `voter_access_<uuid>` cookie. Grants access to submit a ranking for that voting. Also in `voting-access.ts`.

Cookies are signed JWTs with `{ votingId, role }` payloads, 12h expiry. `voting-access.ts` exposes `hasVoterAccess(votingId)` / `hasVotingAdminAccess(votingId)` helpers that read+verify the cookie.

### Why middleware is minimal

`src/middleware.ts` runs in Edge runtime, so it **cannot make SQL queries**. It only:
- Clears all `voter_access_*` and `voting_admin_*` cookies on `/` (forces password re-entry each visit).
- Gates `/admin/votings/**` and `/api/admin/votings/**` to superadmin (no DB lookup needed — these are management endpoints).

Per-voting auth (`/vote/[slug]/**`, `/admin/[slug]`) is enforced in **server components**, not middleware, because it needs a slug→UUID DB lookup. Pattern: `getVotingBySlug` → 404 if null → check `hasVoterAccess(voting.id)` → `redirect(/access)` if false.

### Data layer

`src/lib/db/client.ts` is the only file that uses `@vercel/postgres`. Two tables:

- `votings` — UUID PK, slug (unique), name, short_name, description, accent colors, logo_url, bcrypt `voter_password_hash` + `admin_password_hash`, position (for ordering), active.
- `rankings` — UUID PK, full_name, email, `voting` UUID FK → `votings.id`, positions JSONB (array of 32 QB ids), unique on `(email, voting)`.

Always **strip password hashes** before passing voting rows to client components: use the exported `VotingPublic` type (`Omit<VotingRow, "voter_password_hash" | "admin_password_hash">`) and the `stripSecrets` helper / inline destructuring (`const { voter_password_hash: _v, admin_password_hash: _a, ...publicVoting } = voting`).

DB columns are **snake_case** (`logo_url`, `short_name`, `full_name`, `updated_at`). Don't convert to camelCase — the types reflect the DB shape.

### The ranking algorithm

`src/lib/ranking-algorithm.ts` — bottom-up Borda in 7 rounds. Each round picks the worst QBs first (positions 32→28, 27→23, …, 4→1) by summing per-voter points for that QB's appearances in the bottom slots. Rounds 1–4 use top-5 points (5,4,3,2,1); rounds 5–7 use top-4 (4,3,2,1).

Returns `GlobalRankingResult` with both a flat `ranking[]` (each entry has `roundIndex`) and `rounds[]` (per-round breakdown with `positionsAssigned: [low, high]`). The admin **Stream mode** UI relies on filtering `ranking[]` by `roundIndex` and pairing with `rounds[i].positionsAssigned` — no algorithm changes needed for that view.

Tests in `ranking-algorithm.test.ts` lock in tie-breaks and edge cases; don't change the algorithm without updating those.

### Routes overview

- `/` — server component, lists active votings; `HomeForm.tsx` is the client form.
- `/vote/[voting]` — slug-based. Redirects to `/access` if no voter cookie.
- `/vote/[voting]/access` — password gate (form posts to `/api/voting/[slug]/access`).
- `/vote/[voting]/success?id=...` — shows generated PNG.
- `/api/rankings/[id]/image` — `next/og` Satori rendering; loads Anton/Archivo Black/Inter/JetBrains Mono from Google Fonts as TTF (User-Agent IE6 trick), cached. Auto-shrinks the user's name based on length.
- `/admin` — superadmin dashboard with `VotingsManager` (reorder, edit, deactivate) and create button.
- `/admin/votings/new` + `/admin/votings/[id]/edit` — `VotingForm` for CRUD.
- `/admin/[voting]` — superadmin OR voting admin only; renders `AdminRankingView` with list/stream toggle, deep-linked via `?mode=stream&round=N`.

### Validation

All API inputs go through Zod schemas in `src/lib/schemas.ts`. Notable: `RankingSubmissionSchema.fullName` uses `.transform(toTitleCase)` — server normalizes names (handles accents, hyphens, apostrophes). Keep this transform when editing.

## Conventions specific to this repo

- Spanish UI copy (mantén el idioma en strings de UI nuevas).
- Tailwind 4 + custom CSS vars in `globals.css`: `--color-foreground`, `--color-surface`, `--color-surface-2`, `--color-muted`, `--color-border`, `--color-accent`, `--color-accent-dark`. Per-voting accent colors come from the DB (`voting.accent`, `voting.accent_dark`), applied inline via `style`.
- Fonts: `font-display` (Anton), `font-subhead` (Archivo Black), `font-mono` (JetBrains Mono).
- Route segments use `[voting]` as the **slug** parameter name (e.g. `/vote/nfl-alicante`). API access endpoint variants exist as `[slug]` in `/api/voting/[slug]/access` — keep that distinction.
- `src/data/votings.ts` was **deleted** (votings now live in DB). Don't recreate it. `src/data/qbs.ts` and `src/data/teams.ts` remain hardcoded.

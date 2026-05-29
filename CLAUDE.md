# CLAUDE.md

Guía rápida del codebase para agentes. Mantener conciso.

## Qué es

Webapp para crear/compartir un top 32 de QBs de la NFL 2026. Varias votaciones
independientes. Panel de admin que calcula el ranking global con un algoritmo
iterativo bottom-up. Idioma de UI, comentarios y commits: **español**.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
Vercel Postgres (`@vercel/postgres`) · auth admin cookie JWT (`jose`) + bcrypt ·
imágenes OG con `@vercel/og` · drag&drop `@dnd-kit` · validación `zod` ·
tests `vitest`.

## Comandos

```
npm run dev          # http://localhost:3000
npm run build
npm test             # vitest run  (test:watch para modo watch)
npm run lint         # eslint
npm run db:migrate   # crea enum + tabla rankings (idempotente, usa .env.local)
```

Env: `POSTGRES_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` (32+ chars),
`NEXT_PUBLIC_APP_URL`. Ver `README.md` para el flujo de Vercel.

## Mapa del código (`src/`)

- `data/qbs.ts` — 32 QBs (`{id, name, teamAbbr}`); `getQbById`, `getQbIds`.
- `data/teams.ts` — equipos NFL (colores, logos); `getTeamByAbbr`.
- `data/anya.ts` — valores ANY/A por QB + `computeAnyaRanking()` (competition
  ranking; QBs sin dato → `{value:null, rank:null}`).
- `lib/ranking-algorithm.ts` — **core**: `computeGlobalRanking()`, 7 rondas
  bottom-up (`ROUNDS`), tie-break en `compareTie()`. Devuelve `ranking[]` +
  `rounds[]` (breakdowns). Tests en `.test.ts` adjunto.
- `lib/ranking-deviation.ts` — desviación de cada votante vs consenso.
- `lib/db/client.ts` — queries Postgres; tipos `VotingRow`/`RankingRow`/`VotingPublic`.
- `lib/db/migrate.ts` — migración (script `db:migrate`).
- `lib/schemas.ts` — esquemas zod. `lib/auth.ts` + `lib/voting-access.ts` +
  `middleware.ts` — sesiones/JWT y control de acceso.

### Rutas (App Router)

- `/` (`app/page.tsx` + `HomeForm`) → `/vote/[voting]` (board drag&drop:
  `RankingBoard`, `QbCard`, `RankingSlot`) → `success` con imagen PNG.
- API votante: `api/rankings/route.ts` (upsert por `email,voting`),
  `api/rankings/[id]/image/route.tsx` (OG).
- Admin: `/admin` (login) → `/admin/[voting]/page.tsx` (server: calcula ranking)
  → `AdminRankingView.tsx` (client: modos **lista**/**stream**, checkbox
  comparar con ANY/A). Votantes: `/admin/[voting]/votantes/[voterId]`.
- Gestión votaciones: `app/admin/votings/*` + `components/VotingForm`,
  `VotingsManager`. API admin bajo `api/admin/*`.

## Convenciones

- Tooltips = atributo `title`. Checkbox: patrón de `VotingForm.tsx`.
- Colores diff: verde `#16a34a` (infravalorado), rojo `#dc2626` (sobrevalorado).
- Estado UI client-side con `useState`; sync a URL solo donde aporta (modo stream).
- Tests junto al archivo (`*.test.ts`). El entorno web puede no tener
  `node_modules`: `vitest` corre vía `npx`, pero `tsc`/`eslint` reportarán
  "cannot find module" en todo el repo (no es señal de error en tu cambio).

# QBRankings

Webapp para crear y compartir tu top 32 de QBs titulares de la NFL 2026, con
dos votaciones independientes (NFL Alicante y El Capologist) y panel de admin
con el ranking global calculado mediante un algoritmo iterativo bottom-up.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Vercel Postgres (Neon) con `@vercel/postgres`
- Generación de imagen con `next/og` (Satori)
- Auth admin con cookie JWT (`jose`) + contraseña en `.env`

## Variables de entorno

Copia `.env.example` a `.env.local`:

```
POSTGRES_URL=…              # se rellena tras conectar Vercel Postgres
ADMIN_PASSWORD=changeme
SESSION_SECRET=<32+ chars random>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

En Vercel, `vercel env pull` los descarga al `.env.local` automáticamente
después de conectar la base de datos al proyecto.

## Scripts

```
npm run dev          # arranca en http://localhost:3000
npm run build        # build de producción
npm run db:migrate   # crea el enum + tabla rankings (idempotente)
npm test             # tests del algoritmo (vitest)
npm run lint         # eslint
```

## Flujo

1. `/` — landing con nombre + email + selector visual de votación.
2. `/vote/[voting]` — tap en QB para colocarlo, botones ↑/↓/✕ para reordenar,
   autosave en `localStorage`.
3. `POST /api/rankings` — upsert por `(email, voting)`.
4. `/vote/[voting]/success?id=…` — muestra la imagen PNG generada por
   `/api/rankings/[id]/image`.
5. `/admin` — login. Tras auth, `/admin/[voting]` calcula y muestra el ranking
   global. Solo accesible con la contraseña.

## Algoritmo de ranking global

Implementado en `src/lib/ranking-algorithm.ts`. Bottom-up por bloques:

- Rondas 1–4: top 5 por puntos en los últimos 5 de cada votante (5,4,3,2,1
  pts), asignando los puestos 32→28, 27→23, 22→18, 17→13.
- Rondas 5–7: top 4 por puntos en los últimos 4 (4,3,2,1 pts) para los
  puestos 12→9, 8→5, 4→1.

Tests en `src/lib/ranking-algorithm.test.ts`.

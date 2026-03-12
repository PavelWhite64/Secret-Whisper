# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project: Шёпот (Whisper)

An anonymous secret-sharing social network. Like Twitter but for secrets — each post has a lifetime (1h, 24h, 7d) and disappears automatically. Anonymous by default, optional accounts require only username + password.

### Features
- Anonymous whisper feed with auto-refresh
- Countdown timer on each whisper card
- Reactions: ❤️ heart, 🔥 fire, 😮 wow
- Optional accounts (username + password only, sessions via express-session)
- Lifetime options: 1 hour, 24 hours, 7 days
- Dark mysterious UI theme

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── shopot/             # React/Vite frontend (Шёпот app)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with session-based auth (express-session) and bcryptjs for password hashing.

Routes:
- `GET /api/healthz` — health check
- `POST /api/auth/register` — register (username + password)
- `POST /api/auth/login` — login
- `POST /api/auth/logout` — logout
- `GET /api/auth/me` — get current user
- `GET /api/whispers` — list active (non-expired) whispers
- `POST /api/whispers` — create whisper
- `GET /api/whispers/:id` — get single whisper
- `POST /api/whispers/:id/react` — react (fire/heart/wow)

### `artifacts/shopot` (`@workspace/shopot`)

React + Vite frontend with dark mysterious design. Uses React Query, Framer Motion, Wouter routing.

### `lib/db` (`@workspace/db`)

Database tables:
- `users` — id, username, password_hash, created_at
- `whispers` — id, content, lifetime, expires_at, created_at, user_id, reaction_fire, reaction_heart, reaction_wow

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec for the Шёпот API. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

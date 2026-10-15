# WebSide — repository guide

Product: **WebSide** — «Your web. Your side.» A zero-budget website-builder SaaS.
Admin panel: **SUDO**.

## What this is

Customers create a site, customise it in a block editor, preview it, save revisions, and submit an
exact revision for owner review. The owner (SUDO) reviews that exact submitted version, approves or
rejects it, publishes approved sites **manually outside the application**, then records the verified
public URL back in SUDO.

## Stack

- Next.js (App Router, `src/` dir) + React + TypeScript (strict).
- Tailwind CSS v4 (CSS-first config in `src/app/globals.css`).
- Supabase: Postgres + Auth + RLS + Storage, accessed via `@supabase/supabase-js` and `@supabase/ssr`.
- Validation with `zod`.

## Commands

```bash
npm run dev        # local dev server (port 3000)
npm run build      # production build + type check
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Conventions

- Design tokens live in `src/app/globals.css`; never scatter raw hex values in components.
- The wordmark is typography only (`src/components/wordmark.tsx`). Never invent a monogram/icon.
- All database access goes through typed helpers in `src/lib/`. Server-side privileged access uses
  the service-role key and is confined to SUDO server actions.
- Row Level Security is the primary authorisation boundary. Never rely on the UI alone.
- Keep server actions small and validated with zod before touching the database.

## Environment

`.env.local` (never committed) — see `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; SUDO operations)
- `SUDO_ADMIN_EMAILS` (comma-separated allowlist for admin access)

## Design system

See `docs/DESIGN_SYSTEM.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

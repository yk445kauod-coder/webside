# WebSide

> **Your web. Your side.**

WebSide is a calm, precise website builder. Customers design a site in a block editor, preview it,
save immutable versions, and submit an **exact version** for review. The owner (the **SUDO** admin
panel) reviews that frozen version, approves or rejects it with feedback, publishes approved sites
manually outside the app, and records the verified public URL back in SUDO.

- **Exact versions** – a submission points at an immutable, hashed snapshot; what the owner reviews
  can never drift from what the customer submitted.
- **One renderer** – the editor canvas, full preview, landing-page showcase and SUDO review all use
  the same `BlockView`, so "what you see" is what gets reviewed.
- **Authorisation in the database** – Row Level Security is the boundary; the UI is never trusted.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) · React 19 · TypeScript (strict) |
| Styling | Tailwind CSS v4, CSS-first tokens in `src/app/globals.css` |
| Backend | Supabase — Postgres, Auth, RLS (`@supabase/ssr`, `@supabase/supabase-js`) |
| Validation | `zod` v4 |
| Tests | Vitest |

> This Next.js version differs from older ones (e.g. `error.tsx` receives `retry`, not `reset`;
> cookie-reading routes declare `export const instant = false`). The version-matched docs ship in
> `node_modules/next/dist/docs/` — read them before changing framework-level code.

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in your Supabase values
npm run dev                     # http://localhost:3000
```

### Database

Apply the migrations in `supabase/migrations/` in order (Supabase CLI `supabase db push`, or paste
them into the SQL editor):

| Migration | Purpose |
| --- | --- |
| `00001_initial_schema.sql` | Tables, triggers, RLS, SUDO RPCs, seed |
| `00002_sudo_read_access.sql` | Read access for the SUDO panel |
| `00003_security_and_performance_hardening.sql` | Closes a self-approval hole, locks down function privileges, optimises RLS, adds FK indexes |

**Making yourself SUDO.** The admin allowlist is a row in `public.settings`
(`key = 'sudo_admin_emails'`, a JSON array of emails) — it is read by the `is_sudo()` SQL function,
not by an environment variable:

```sql
update public.settings
set value = '["you@example.com"]'::jsonb
where key = 'sudo_admin_emails';
```

## Deploying (Cloudflare Workers via GitHub Actions)

Pushes to `master` run `.github/workflows/deploy.yml`: typecheck → lint → tests → build with
[OpenNext for Cloudflare](https://opennext.js.org/cloudflare) → `wrangler` deploy. Pull requests run
the checks only.

Repository **secrets** the workflow needs (Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | API token with *Edit Cloudflare Workers* permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account id |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key |

The app is served from `https://webside.<your-subdomain>.workers.dev` (change `name` in
`wrangler.jsonc` to rename it). Add your Supabase redirect URL under **Auth → URL Configuration**.
This is Workers, not the legacy Pages product: the OpenNext adapter only targets Workers.
`cacheComponents` is deliberately off: on Workers it hangs every request (error 1101).

Local: `npm run cf:preview` builds and runs the Worker locally; `npm run cf:deploy` deploys from your
machine (needs `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` in the environment).

> `src/proxy.ts` runs as Node.js middleware, which OpenNext marks experimental on Cloudflare. If
> sessions misbehave in production, that is the first place to look.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build + type check
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest (unit tests for URL safety, validation, status logic)
npm run check       # typecheck + lint + tests
```

## Project layout

```
src/
  app/
    (marketing)/        landing page
    (auth)/             sign in / sign up + server actions
    dashboard/          customer area: site grid, editor route, server actions
    sudo/               owner area: review queue, audit trail, server actions
    error.tsx, not-found.tsx, */loading.tsx, */error.tsx
  components/
    ui/                 Button, Field, Badge, Dialog, Spinner (design-system primitives)
    editor/             SiteEditor, block controls/palette, autosave hook, editor chrome
    preview/            BlockView + PreviewCanvas (the single renderer)
    site/               navs, new-site dialog, SUDO queue + review dialog
  lib/
    auth.ts             cached session / is_sudo lookups
    schemas.ts          zod validation + sanitising for everything the editor saves
    safe-url.ts         href/src allowlist (blocks `javascript:` etc.)
    limits.ts           content limits shared by UI inputs and server validation
    queries/            typed, minimal data access for the dashboard and SUDO
    supabase/           browser, server (RLS) and admin (service-role) clients
    templates.ts        starter templates
supabase/migrations/    SQL schema + policies
docs/                   DESIGN_SYSTEM.md, REVIEW.md
```

## How a site moves through the system

```
customer edits ──autosave──▶ pages (mutable working copy)
      │
      ├─ "Save version" ──▶ revisions (immutable snapshot + SHA-256 hash)
      │
      └─ "Submit" ───────▶ submissions (status: submitted)
                                │  SUDO: take into review → approve / reject (+ feedback)
                                ▼
                         approved ──▶ owner publishes manually ──▶ publications (verified URL)
```

Every status change and publication goes through audited `SECURITY DEFINER` RPCs
(`sudo_set_submission_status`, `sudo_record_publication`) that re-check `is_sudo()` in Postgres and
write to `audit_logs`.

## Conventions

- **Tokens, not hex.** Colours, radii and shadows live in `globals.css`; components use token
  utilities (`bg-cobalt-strong`, `text-apricot-ink`, …). See `docs/DESIGN_SYSTEM.md`.
- **Wordmark is typography only.** Never add a monogram or icon.
- **Validate on the server.** Every server action parses its input with zod before touching the
  database; customer-authored URLs go through `safe-url.ts` both when saved and when rendered.
- **`"use server"` files export only async functions** — constants and types live elsewhere.
- **Status is never colour alone** — always pair it with a text label.
- **Server data access stays minimal.** Select only the columns a screen needs; snapshots (which
  can be large) are loaded only where they are actually displayed.

## Accessibility

Skip link, visible focus rings, labelled controls and dialogs (focus trap, Escape, focus return),
`aria-current`/`aria-pressed` states, live regions for save status and toasts, keyboard-selectable
blocks in the editor, and `prefers-reduced-motion` support.

## Further reading

- [`docs/REVIEW.md`](docs/REVIEW.md) – what was reviewed and changed, with a before/after
  evaluation and the remaining roadmap.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) – brand, colour, type, motion, accessibility.

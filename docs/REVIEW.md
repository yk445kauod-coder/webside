# WebSide — Review: before & after

Scope: a full read of the codebase (41 source files), the migrations, and the live Supabase project
(`webside`, advisors + table list — read-only), followed by refactoring of the important parts and a
UI/UX retouch.

**How to read the numbers.** Section 1 is *measured* (commands run on the original commit and on the
result). Section 3 scores are *my judgement* of the code on a 1–10 scale — useful for direction, not
an audit. Section 5 lists what was **not** verified.

## 1. Measured, before → after

| Metric | Before | After |
| --- | --- | --- |
| `tsc --noEmit` | pass | pass |
| `eslint` | pass | pass |
| `next build` (Turbopack) | pass¹ | pass¹ |
| Unit tests | **0** | **28** (3 files, all passing) |
| Source files / non-test LOC | 41 / 4 240 | 60 / 5 418 |
| Largest component | `site-editor.tsx` — **832** lines | `site-editor.tsx` — **503** lines (chrome split into `editor-parts.tsx`, autosave into `use-autosave.ts`) |
| Raw hex colours in components | 16 | **0** (all via tokens) |
| `aria-*` / `role` attributes | 21 | 93 |
| Error / loading / not-found boundaries | 0 | 6 |
| Server entrypoints validating input with zod | 2 | 4 (+ every editor save is schema-validated and sanitised) |
| Files guarding `href`/`src` against `javascript:` | 0 | 4 |
| Dashboard payload | every page's full block JSON + every revision snapshot | page ids only (counts), no snapshots |

¹ Built in a scratch copy with Google Fonts stubbed out, because the sandbox cannot reach
`fonts.googleapis.com`. The same stub was applied to both the original and the new code.

LOC grew because the work added things that did not exist (tests, boundaries, dialog primitive,
validation layer, mobile editor, migration), not because existing code was inflated.

## 2. What was wrong, and what changed

### Bugs (functional)

| # | Problem | Fix |
| --- | --- | --- |
| 1 | **The SUDO panel was unreachable.** `sudo/layout.tsx` destructured `data: { isSudo }` from `rpc("is_sudo")`, which returns a boolean — so `isSudo` was always `undefined` and every admin was redirected away. TypeScript could not catch it (untyped RPC). | `lib/auth.ts` → `isSudoUser()`; layout uses it. |
| 2 | **Pages added in the editor were never saved.** "Add page" only changed local state; autosave looked the page up by key in the *server props*, found nothing, and skipped it. | `createPage` server action persists immediately; tabs now carry their DB id. |
| 3 | **Edits could be lost.** Autosave watched only the active page; switching tabs inside the 900 ms debounce dropped the edit. "Save version" / "Submit" snapshot the *database*, so they could capture stale content. | `useAutosave` tracks every page, serialises saves, warns on unload, and exposes `flush()`; save-version and submit flush first. |
| 4 | Submitting while a submission was open still wrote a new revision first (orphan versions); revision numbers could race. | Fail-fast check before writing; identical content is not re-versioned; number insert retries on conflict. |
| 5 | "Last saved" never changed when you edited (only `sites` rows bumped `updated_at`). | Saving a page touches the site. |
| 6 | Links inside blocks navigated away while editing. | Canvas blocks are inert in editor mode. |
| 7 | Sign-up with email confirmation redirected to `/dashboard` → bounced to `/login` with no explanation. | Returns a "check your inbox" notice. |
| 8 | Non-Latin site names (e.g. Arabic) slugified to nothing and failed validation. | Safe fallback slug. |
| 9 | A failed page insert left a page-less site behind. | Rolled back. |
| 10 | Mobile: the block inspector was hidden below `lg`, so blocks could not be edited on a phone; the SUDO nav (incl. Audit) was hidden on small screens. | Drawer + bottom-sheet inspector; nav always visible. |

### Security

| # | Finding | Fix |
| --- | --- | --- |
| 1 | **Self-approval.** The `submissions` INSERT policy never constrained `status`, so a customer could insert a submission that is already `approved` (and set reviewer fields), bypassing review. | Migration `00003`: insert allowed only as a fresh `submitted` row with no reviewer fields. |
| 2 | **Stored XSS vector.** `href`/`src` values written by customers were rendered as-is (`javascript:`), and the *SUDO reviewer* is the person who views them. | `safe-url.ts` allowlist, applied on save (zod transform) **and** on render. Covers case tricks and embedded whitespace (`java\nscript:`). |
| 3 | Editor saved arbitrary JSON into `pages.blocks`. | Server-side discriminated-union schema with size limits shared with the UI (`limits.ts`). |
| 4 | `SECURITY DEFINER` functions executable by `anon` via `/rest/v1/rpc` (5 advisor warnings). | Revoked in `00003`; trigger functions are no longer callable at all. |
| 5 | `touch_updated_at` had a mutable `search_path`. | Pinned. |
| 6 | Server actions accepted any string id. | UUID-validated. |

### Performance

- Dashboard no longer downloads every page's block JSON and every revision snapshot to show a count.
- SUDO queue fetches only the revisions and owners on screen, caps history at 100, and counts
  approvals in SQL instead of loading rows.
- Editor stops loading revision snapshots it never displays.
- `getUser()` / `is_sudo()` are request-cached (`React.cache`) instead of repeated per layout/page.
- Postgres: RLS policies now use `(select auth.uid())` (9 `auth_rls_initplan` warnings), overlapping
  permissive policies merged (35 warnings), 6 missing foreign-key indexes added.

### UI / UX

- **Editor:** mobile drawer + bottom-sheet inspector; duplicate block; move up/down disabled at the
  ends; new blocks insert *after* the selection; delete-page with confirmation; save status with
  **Retry**; unsaved-changes warning; toast is an ARIA live region; keyboard-selectable blocks.
- **Dialogs:** one accessible `Dialog` (Escape, focus trap, focus return, scroll lock, bottom sheet on
  phones) replaces three hand-rolled modals.
- **Forms:** inputs enforce the same limits as the server; labelled errors (`aria-invalid`,
  `aria-describedby`); auto-slug stops overwriting once you edit the address.
- **Landing:** the hero now shows a real product shot rendered by the actual block renderer (cannot
  drift from the product); sticky header; mobile gutters.
- **Dashboard / SUDO:** status + feedback visible on cards (rejection reason shown to the customer),
  active-route nav state, owners see a SUDO link, "forbidden" banner, skeleton loading states,
  friendly error and 404 pages, Reject requires feedback.
- **Design system:** hover/active shades became tokens; dark-background (`ink`) blocks now have legible
  secondary text; skip link; consistent `type="button"` default.

### Maintainability

- Server actions split into small helpers (`buildSnapshot`, `insertRevision`, …) instead of two
  copy-pasted 40-line snapshot blocks.
- Single source of truth for content limits, status metadata and the session/SUDO lookups.
- Dead code removed (`Spinner` is now used; unused helpers and the shadow `isSudoUser` server action
  — which was a publicly callable endpoint — are gone).
- `AGENTS.md` / README corrected: `SUDO_ADMIN_EMAILS` was documented but never read; the allowlist
  lives in `public.settings`. `.env.example` now exists (it was referenced but git-ignored).

## 3. Scorecard (judgement, 1–10)

| Area | Before | After | Why |
| --- | :---: | :---: | --- |
| Correctness | 4 | 8 | Admin panel unreachable, unsaved new pages, lost edits → fixed |
| Security | 4 | 8² | Self-approval + XSS vector closed; **² DB part pending migration** |
| Performance | 5 | 7 | Over-fetching removed; SUDO still loads snapshots for card counts |
| UX | 6 | 8 | Mobile editing, recovery paths, feedback loops |
| Accessibility | 5 | 8 | Dialogs, labels, live regions, keyboard, contrast |
| Maintainability | 6 | 8 | Smaller units, shared limits/status/auth, no hex scatter |
| Test confidence | 1 | 5 | Pure logic covered; no component or E2E tests yet |

## 4. Live Supabase project (read-only inspection)

Project `webside` (`ykmohhwebarvtrpsdkiy`, eu-central-1, healthy). Tables: `profiles` 3 rows,
`settings` 1, `sites` 1, everything else empty; RLS enabled on all tables.

- Advisors reported: 5 + 5 `SECURITY DEFINER` exposure warnings, 1 mutable `search_path`, 9 RLS
  initplan, 35 multiple-permissive-policies, 6 unindexed foreign keys, and **leaked-password
  protection disabled** (Auth setting).
- **Nothing was changed in the database.** `00003_security_and_performance_hardening.sql` is in the
  repo, written to be re-runnable. Apply it with `supabase db push` or the SQL editor — and run the
  advisors again afterwards. I'd recommend applying it soon: it closes the self-approval hole.
- Observation: there is **1 site and 0 pages**. The old `createSite` could leave exactly that state
  if the page insert failed. The editor now shows a clear message for such a site; the row itself
  is yours to delete or repair.

## 5. Not verified — be aware

- **No browser run.** Everything compiles, type-checks, lints, builds and passes unit tests, but I did
  not click through the UI against a real Supabase session. Please smoke-test: sign up → create site →
  edit on desktop and phone → save version → submit → SUDO review → approve → record URL.
- Migration `00003` was written against the schema in `00001/00002` and the advisor output, but was
  **not executed**. It is reversible only by restoring the previous policies from `00001/00002`.
- Password minimum is now 8 characters in the UI/server action; Supabase Auth's own minimum is a
  dashboard setting and should match.

## 6. Roadmap (not done)

1. Apply `00003`; enable leaked-password protection; `validate constraint sites_slug_format`.
2. Generate DB types with the Supabase CLI instead of hand-written row types (this is what would
   have caught the `is_sudo` bug at compile time).
3. Component tests + one Playwright happy-path E2E (the flow in §5).
4. Image upload via Supabase Storage (today: pasted URLs only).
5. Block drag-and-drop reordering; undo/redo.
6. SUDO: compute page/block counts in SQL so the queue never loads snapshots; load a snapshot only
   when a review dialog opens. Pagination for history.
7. Rate-limit server actions (sign-in, save, submit).
8. RTL + Arabic locale support, if the product targets Arabic-speaking customers.

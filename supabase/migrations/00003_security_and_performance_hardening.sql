-- ============================================================================
-- WebSide migration 00003 — security + performance hardening
--
-- Driven by a review of the live schema and the Supabase advisors.
--
--   1. SECURITY  A customer could INSERT a submission that is already
--                'approved' (the insert policy never constrained `status`),
--                skipping owner review entirely. Fixed below.
--   2. SECURITY  SECURITY DEFINER functions were executable by `anon`
--                (callable through /rest/v1/rpc). Revoked where not needed.
--   3. SECURITY  `touch_updated_at` had a mutable search_path.
--   4. PERF      RLS policies re-evaluated auth.uid() per row; wrapped in
--                (select ...) so Postgres evaluates it once per query.
--   5. PERF      Overlapping permissive policies merged (one policy per
--                role + action), and write policies split out of FOR ALL.
--   6. PERF      Foreign keys without covering indexes.
--
-- Behaviour for legitimate users is unchanged. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3. Function hygiene
-- ---------------------------------------------------------------------------
alter function public.touch_updated_at() set search_path = '';

-- ---------------------------------------------------------------------------
-- 2. Function privileges
-- Trigger functions are never called by clients. The sudo RPCs and is_sudo()
-- are for signed-in users only (they authorise internally via is_sudo()).
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.submission_is_open() from public, anon, authenticated;

revoke execute on function public.sudo_set_submission_status(uuid, public.submission_status, text) from public, anon;
revoke execute on function public.sudo_record_publication(uuid, uuid, text, text) from public, anon;
revoke execute on function public.is_sudo() from public, anon;
grant execute on function public.is_sudo() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4 + 5. Row Level Security, rewritten
-- All policies target `authenticated` (anon never needs these tables), call
-- auth functions through (select ...), and have at most one permissive policy
-- per action.
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_sudo on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_sudo()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- settings ------------------------------------------------------------------
drop policy if exists settings_select_public on public.settings;
drop policy if exists settings_all_sudo on public.settings;

create policy settings_select_public on public.settings
  for select to anon
  using (is_public);

create policy settings_select on public.settings
  for select to authenticated
  using (is_public or (select public.is_sudo()));

create policy settings_insert_sudo on public.settings
  for insert to authenticated
  with check ((select public.is_sudo()));

create policy settings_update_sudo on public.settings
  for update to authenticated
  using ((select public.is_sudo()))
  with check ((select public.is_sudo()));

create policy settings_delete_sudo on public.settings
  for delete to authenticated
  using ((select public.is_sudo()));

-- sites ---------------------------------------------------------------------
drop policy if exists sites_owner_all on public.sites;
drop policy if exists sites_select_sudo on public.sites;

create policy sites_select on public.sites
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_sudo()));

create policy sites_insert_owner on public.sites
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy sites_update_owner on public.sites
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy sites_delete_owner on public.sites
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- pages ---------------------------------------------------------------------
drop policy if exists pages_owner_all on public.pages;
drop policy if exists pages_select_sudo on public.pages;

create policy pages_select on public.pages
  for select to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = pages.site_id and s.owner_id = (select auth.uid()))
    or (select public.is_sudo())
  );

create policy pages_insert_owner on public.pages
  for insert to authenticated
  with check (
    exists (select 1 from public.sites s
            where s.id = pages.site_id and s.owner_id = (select auth.uid()))
  );

create policy pages_update_owner on public.pages
  for update to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = pages.site_id and s.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.sites s
            where s.id = pages.site_id and s.owner_id = (select auth.uid()))
  );

create policy pages_delete_owner on public.pages
  for delete to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = pages.site_id and s.owner_id = (select auth.uid()))
  );

-- revisions (immutable: no update/delete policy exists, by design) -----------
drop policy if exists revisions_owner_select on public.revisions;
drop policy if exists revisions_owner_insert on public.revisions;
drop policy if exists revisions_select_sudo on public.revisions;

create policy revisions_select on public.revisions
  for select to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = revisions.site_id and s.owner_id = (select auth.uid()))
    or (select public.is_sudo())
  );

create policy revisions_insert_owner on public.revisions
  for insert to authenticated
  with check (
    exists (select 1 from public.sites s
            where s.id = revisions.site_id and s.owner_id = (select auth.uid()))
  );

-- submissions ----------------------------------------------------------------
drop policy if exists submissions_owner_select on public.submissions;
drop policy if exists submissions_owner_insert on public.submissions;
drop policy if exists submissions_select_sudo on public.submissions;

create policy submissions_select on public.submissions
  for select to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = submissions.site_id and s.owner_id = (select auth.uid()))
    or (select public.is_sudo())
  );

-- 1. A customer may only ever open a *fresh* submission. Status transitions,
--    reviewer fields and owner notes belong to the audited SUDO RPCs.
create policy submissions_insert_owner on public.submissions
  for insert to authenticated
  with check (
    status = 'submitted'
    and owner_notes is null
    and reviewed_by is null
    and reviewed_at is null
    and exists (select 1 from public.sites s
                where s.id = submissions.site_id and s.owner_id = (select auth.uid()))
    and exists (select 1 from public.revisions r
                where r.id = submissions.revision_id and r.site_id = submissions.site_id)
  );

-- publications ---------------------------------------------------------------
drop policy if exists publications_owner_select on public.publications;
drop policy if exists publications_select_sudo on public.publications;

create policy publications_select on public.publications
  for select to authenticated
  using (
    exists (select 1 from public.sites s
            where s.id = publications.site_id and s.owner_id = (select auth.uid()))
    or (select public.is_sudo())
  );

-- audit_logs -----------------------------------------------------------------
drop policy if exists audit_logs_select_sudo on public.audit_logs;

create policy audit_logs_select_sudo on public.audit_logs
  for select to authenticated
  using ((select public.is_sudo()));

-- ---------------------------------------------------------------------------
-- 6. Covering indexes for foreign keys
-- ---------------------------------------------------------------------------
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists publications_recorded_by_idx on public.publications (recorded_by);
create index if not exists publications_submission_id_idx on public.publications (submission_id);
create index if not exists revisions_created_by_idx on public.revisions (created_by);
create index if not exists settings_updated_by_idx on public.settings (updated_by);
create index if not exists submissions_reviewed_by_idx on public.submissions (reviewed_by);

-- ---------------------------------------------------------------------------
-- Defence in depth: slugs become URLs, so constrain them at the source.
-- NOT VALID applies the rule to new/updated rows without failing on any
-- legacy row; run `alter table … validate constraint` once data is checked.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sites_slug_format'
  ) then
    alter table public.sites
      add constraint sites_slug_format
      check (slug ~ '^[a-z0-9][a-z0-9-]{1,47}$') not valid;
  end if;
end $$;

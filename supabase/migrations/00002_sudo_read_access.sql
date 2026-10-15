-- ============================================================================
-- WebSide migration 00002 — SUDO read access
--
-- The owner (SUDO) needs read access across the review pipeline so the admin
-- panel can list all customer sites, submissions, revisions, and publications.
-- The owner manually publishes approved projects outside the app and then
-- records the verified public URL in SUDO — so write access stays where it is
-- (owner policies + the audited SUDO RPCs).
-- ============================================================================

create policy sites_select_sudo on public.sites
  for select using (public.is_sudo());

create policy pages_select_sudo on public.pages
  for select using (public.is_sudo());

create policy revisions_select_sudo on public.revisions
  for select using (public.is_sudo());

create policy submissions_select_sudo on public.submissions
  for select using (public.is_sudo());

create policy publications_select_sudo on public.publications
  for select using (public.is_sudo());

create policy profiles_select_sudo on public.profiles
  for select using (public.is_sudo());
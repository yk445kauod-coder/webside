-- ============================================================================
-- WebSide — Initial schema
-- Customers create sites, save immutable revisions, and submit an exact
-- revision for owner review. SUDO (owner) reviews that exact revision,
-- approves, publishes manually outside the app, and records the public URL.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.submission_status as enum ('submitted', 'under_review', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- settings (centralised app configuration, incl. sudo admin allowlist)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Untitled site',
  slug text not null,
  description text,
  template_key text not null default 'blank',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  unique (owner_id, slug)
);

create index if not exists sites_owner_id_idx on public.sites (owner_id);

-- ---------------------------------------------------------------------------
-- pages — the customer's mutable working copy
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  key text not null,
  title text not null default '',
  path text not null default '/',
  blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, key),
  unique (site_id, path)
);

create index if not exists pages_site_id_idx on public.pages (site_id);

-- ---------------------------------------------------------------------------
-- revisions — immutable, whole-site snapshots ("exact version")
-- ---------------------------------------------------------------------------
create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  number integer not null,
  pages jsonb not null default '{}'::jsonb,          -- { pageKey: { title, path, blocks } }
  content_hash text not null,                         -- sha256 of canonical JSON
  label text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (site_id, number)
);

create index if not exists revisions_site_number_idx
  on public.revisions (site_id, number desc);
create index if not exists revisions_site_created_idx
  on public.revisions (site_id, created_at);

-- ---------------------------------------------------------------------------
-- submissions — the review pipeline (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  revision_id uuid not null references public.revisions (id) on delete cascade,
  status public.submission_status not null default 'submitted',
  note text,
  owner_notes text,
  reviewed_by uuid references auth.users (id),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (site_id, revision_id)
);

create index if not exists submissions_site_idx on public.submissions (site_id);
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_revision_idx on public.submissions (revision_id);

-- ---------------------------------------------------------------------------
-- publications — verified public URLs recorded in SUDO after manual publish
-- ---------------------------------------------------------------------------
create table if not exists public.publications (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  url text not null,
  note text,
  recorded_by uuid references auth.users (id),
  recorded_at timestamptz not null default now(),
  unique (site_id, url)
);

create index if not exists publications_site_idx
  on public.publications (site_id, recorded_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs — every SUDO / customer governance action
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id),
  actor_role text,
  action text not null,
  entity text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_sudo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.settings s
    cross join auth.users u
    where s.key = 'sudo_admin_emails'
      and u.id = auth.uid()
      and u.email = any (coalesce(s.value::text[], '{}'::text[]))
  );
$$;

create or replace function public.submission_is_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.submissions
    where site_id = new.site_id
      and status in ('submitted', 'under_review')
      and id <> new.id
  ) then
    raise exception 'An open submission already exists for this site';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger sites_touch_updated_at
  before update on public.sites
  for each row execute function public.touch_updated_at();

create trigger pages_touch_updated_at
  before update on public.pages
  for each row execute function public.touch_updated_at();

create constraint trigger submissions_open_once
  after insert on public.submissions
  for each row execute function public.submission_is_open();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.sites enable row level security;
alter table public.pages enable row level security;
alter table public.revisions enable row level security;
alter table public.submissions enable row level security;
alter table public.publications enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: owner reads/updates own; sudo reads all
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id or public.is_sudo());
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- settings: public rows readable by everyone, sudo manages all
create policy settings_select_public on public.settings
  for select using (is_public or public.is_sudo());
create policy settings_all_sudo on public.settings
  for all using (public.is_sudo()) with check (public.is_sudo());

-- sites: owner full control
create policy sites_owner_all on public.sites
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- pages: via site ownership
create policy pages_owner_all on public.pages
  for all using (
    exists (select 1 from public.sites s where s.id = pages.site_id and s.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.sites s where s.id = pages.site_id and s.owner_id = auth.uid())
  );

-- revisions: owner can read + create snapshots; immutable after insert
create policy revisions_owner_select on public.revisions
  for select using (
    exists (select 1 from public.sites s where s.id = revisions.site_id and s.owner_id = auth.uid())
  );
create policy revisions_owner_insert on public.revisions
  for insert with check (
    exists (select 1 from public.sites s where s.id = revisions.site_id and s.owner_id = auth.uid())
  );

-- submissions: owner reads + submits; no updates (stable review target)
create policy submissions_owner_select on public.submissions
  for select using (
    exists (select 1 from public.sites s where s.id = submissions.site_id and s.owner_id = auth.uid())
  );
create policy submissions_owner_insert on public.submissions
  for insert with check (
    exists (select 1 from public.sites s where s.id = submissions.site_id and s.owner_id = auth.uid())
      and exists (select 1 from public.revisions r
                  where r.id = submissions.revision_id and r.site_id = submissions.site_id)
  );

-- publications: owner reads own site's history; recording happens via SUDO
create policy publications_owner_select on public.publications
  for select using (
    exists (select 1 from public.sites s where s.id = publications.site_id and s.owner_id = auth.uid())
  );

-- audit_logs: sudo may read history (writes happen via definer RPCs / service role)
create policy audit_logs_select_sudo on public.audit_logs
  for select using (public.is_sudo());

-- ============================================================================
-- SUDO RPCs (security definer; authorise sudo or service role)
-- ============================================================================
create or replace function public.sudo_set_submission_status(
  p_submission_id uuid,
  p_status public.submission_status,
  p_owner_notes text default null
)
returns public.submissions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.submissions;
begin
  if not public.is_sudo() and (select auth.jwt() ->> 'role') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if not found then
    raise exception 'Submission not found';
  end if;

  if p_status not in ('submitted', 'under_review') and v_sub.status not in ('submitted', 'under_review') then
    raise exception 'Only open submissions can be approved or rejected';
  end if;

  update public.submissions
  set status = p_status,
      owner_notes = coalesce(p_owner_notes, owner_notes),
      reviewed_by = coalesce(auth.uid(), reviewed_by),
      reviewed_at = case when p_status in ('approved', 'rejected') then now() else reviewed_at end
  where id = p_submission_id
  returning * into v_sub;

  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'sudo',
    'submission.' || p_status,
    'submission',
    p_submission_id::text,
    jsonb_build_object('site_id', v_sub.site_id, 'revision_id', v_sub.revision_id, 'notes', p_owner_notes)
  );

  return v_sub;
end;
$$;

create or replace function public.sudo_record_publication(
  p_site_id uuid,
  p_submission_id uuid,
  p_url text,
  p_note text default null
)
returns public.publications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.submissions;
  v_pub public.publications;
begin
  if not public.is_sudo() and (select auth.jwt() ->> 'role') <> 'service_role' then
    raise exception 'Not authorized';
  end if;

  select * into v_sub from public.submissions where id = p_submission_id;
  if not found or v_sub.site_id <> p_site_id then
    raise exception 'Submission does not belong to this site';
  end if;
  if v_sub.status <> 'approved' then
    raise exception 'Only approved submissions can be published';
  end if;
  if p_url !~ '^https?://' then
    raise exception 'Public URL must start with http:// or https://';
  end if;

  insert into public.publications (site_id, submission_id, url, note, recorded_by)
  values (p_site_id, p_submission_id, p_url, p_note, (select auth.uid()))
  returning * into v_pub;

  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
  values (
    (select auth.uid()),
    'sudo',
    'publication.recorded',
    'site',
    p_site_id::text,
    jsonb_build_object('submission_id', p_submission_id, 'url', p_url, 'note', p_note)
  );

  return v_pub;
end;
$$;

grant execute on function public.sudo_set_submission_status(uuid, public.submission_status, text) to authenticated, service_role;
grant execute on function public.sudo_record_publication(uuid, uuid, text, text) to authenticated, service_role;

-- ============================================================================
-- Seed
-- ============================================================================
insert into public.settings (key, value, description, is_public)
values (
  'sudo_admin_emails',
  '["admin@webside.dev"]'::jsonb,
  'Emails allowed to access the SUDO admin panel',
  false
)
on conflict (key) do nothing;
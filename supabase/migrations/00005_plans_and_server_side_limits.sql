-- 00005: package ("plan") per site and limits enforced inside Postgres.
--
-- Additive and safe on the live database:
--   * new enum + one column with a default (existing sites become 'menu');
--   * limits only block NEW pages and block-count / menu-item *growth*; a site that is
--     already above a limit can still edit, shrink and autosave (grandfathered);
--   * the plan can only be changed by SUDO (RPC below) or the service role, so a
--     customer cannot upgrade themselves through the API.
-- The numbers below mirror PLAN_LIMITS in src/lib/limits.ts (a unit test keeps them in sync).

do $$ begin
  create type public.site_plan as enum ('menu', 'business', 'dynamic');
exception when duplicate_object then null;
end $$;

alter table public.sites add column if not exists plan public.site_plan not null default 'menu';

-- ---------------------------------------------------------------------------
-- Limits per plan
-- ---------------------------------------------------------------------------
create or replace function public.plan_max_pages(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 3 when 'business' then 5 when 'dynamic' then 5 end;
$$;

create or replace function public.plan_max_blocks(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 80 when 'business' then 120 when 'dynamic' then 120 end;
$$;

create or replace function public.plan_max_menu_items(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 800 when 'business' then 300 when 'dynamic' then 800 end;
$$;

-- Total menu items inside one page's blocks.
create or replace function public.menu_item_count(p_blocks jsonb)
returns int language sql immutable set search_path = public as $$
  select coalesce(sum(jsonb_array_length(c -> 'items')), 0)::int
  from jsonb_array_elements(case when jsonb_typeof(p_blocks) = 'array' then p_blocks else '[]'::jsonb end) b,
       jsonb_array_elements(
         case when b ->> 'kind' = 'menu' and jsonb_typeof(b -> 'categories') = 'array'
              then b -> 'categories' else '[]'::jsonb end
       ) c
  where jsonb_typeof(c -> 'items') = 'array';
$$;

-- ---------------------------------------------------------------------------
-- Customers can never choose or change their own plan
-- ---------------------------------------------------------------------------
create or replace function public.sites_guard_plan()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and not public.is_sudo() then
      new.plan := 'menu';
    end if;
  elsif new.plan is distinct from old.plan then
    if auth.uid() is not null and not public.is_sudo() then
      raise exception 'Only the platform team can change a plan.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sites_guard_plan on public.sites;
create trigger sites_guard_plan
  before insert or update of plan on public.sites
  for each row execute function public.sites_guard_plan();

-- ---------------------------------------------------------------------------
-- Enforce the limits on pages
-- ---------------------------------------------------------------------------
create or replace function public.pages_enforce_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_plan public.site_plan;
  v_count int;
  v_blocks int;
  v_old_blocks int := 0;
  v_items int;
  v_old_items int := 0;
begin
  -- Locking the site row serialises concurrent page inserts for the same site.
  select plan into v_plan from public.sites where id = new.site_id for update;
  if v_plan is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select count(*) into v_count from public.pages where site_id = new.site_id;
    if v_count >= public.plan_max_pages(v_plan) then
      raise exception 'Plan limit: your plan allows up to % pages.', public.plan_max_pages(v_plan);
    end if;
  else
    if new.blocks is not distinct from old.blocks then
      return new;
    end if;
    v_old_blocks := case when jsonb_typeof(old.blocks) = 'array' then jsonb_array_length(old.blocks) else 0 end;
    v_old_items := public.menu_item_count(old.blocks);
  end if;

  v_blocks := case when jsonb_typeof(new.blocks) = 'array' then jsonb_array_length(new.blocks) else 0 end;
  v_items := public.menu_item_count(new.blocks);

  -- Growth past the cap is refused; staying equal or shrinking is always allowed.
  if v_blocks > public.plan_max_blocks(v_plan) and v_blocks > v_old_blocks then
    raise exception 'Plan limit: your plan allows up to % blocks per page.', public.plan_max_blocks(v_plan);
  end if;
  if v_items > public.plan_max_menu_items(v_plan) and v_items > v_old_items then
    raise exception 'Plan limit: your plan allows up to % menu items per page.', public.plan_max_menu_items(v_plan);
  end if;
  return new;
end;
$$;

drop trigger if exists pages_enforce_plan on public.pages;
create trigger pages_enforce_plan
  before insert or update of blocks on public.pages
  for each row execute function public.pages_enforce_plan();

-- ---------------------------------------------------------------------------
-- SUDO changes a plan (audited)
-- ---------------------------------------------------------------------------
create or replace function public.sudo_set_site_plan(p_site_id uuid, p_plan public.site_plan)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_old public.site_plan;
begin
  if not public.is_sudo() then
    raise exception 'Not authorized';
  end if;
  select plan into v_old from public.sites where id = p_site_id;
  if not found then
    raise exception 'Site not found';
  end if;
  update public.sites set plan = p_plan where id = p_site_id;
  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
  values ((select auth.uid()), 'sudo', 'site.plan_changed', 'site', p_site_id::text,
          jsonb_build_object('from', v_old, 'to', p_plan));
end;
$$;
revoke execute on function public.sudo_set_site_plan(uuid, public.site_plan) from public, anon;
grant execute on function public.sudo_set_site_plan(uuid, public.site_plan) to authenticated, service_role;

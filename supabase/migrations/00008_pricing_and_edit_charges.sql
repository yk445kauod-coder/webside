-- 00008: pricing in EGP and per-edit charges.
-- A site's first publication is included. Every later publish request on a site that already
-- has an approved submission creates one 50 EGP charge row, settled by SUDO after payment.
-- Prices mirror PLAN_PRICING_EGP / EDIT_FEE_EGP in src/lib/limits.ts.

create or replace function public.plan_monthly_price_egp(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 799 when 'business' then 1499 when 'dynamic' then 1499 end;
$$;

create table if not exists public.site_edit_charges (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  submission_id uuid not null unique references public.submissions (id) on delete cascade,
  fee_egp int not null default 50 check (fee_egp >= 0),
  created_at timestamptz not null default now(),
  settled_at timestamptz
);
create index if not exists site_edit_charges_site_idx on public.site_edit_charges (site_id, created_at desc);

alter table public.site_edit_charges enable row level security;

drop policy if exists site_edit_charges_owner_read on public.site_edit_charges;
create policy site_edit_charges_owner_read on public.site_edit_charges
  for select using (
    exists (select 1 from public.sites s where s.id = site_edit_charges.site_id and s.owner_id = auth.uid())
    or public.is_sudo()
  );

drop policy if exists site_edit_charges_sudo_write on public.site_edit_charges;
create policy site_edit_charges_sudo_write on public.site_edit_charges
  for update using (public.is_sudo()) with check (public.is_sudo());

create or replace function public.charge_edit_on_submission()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.submissions s
    where s.site_id = new.site_id and s.status = 'approved' and s.id <> new.id
  ) then
    insert into public.site_edit_charges (site_id, submission_id) values (new.site_id, new.id)
    on conflict (submission_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_charge_edit on public.submissions;
create trigger submissions_charge_edit after insert on public.submissions
  for each row execute function public.charge_edit_on_submission();

revoke execute on function public.charge_edit_on_submission() from public, anon, authenticated;

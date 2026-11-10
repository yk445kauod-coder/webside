-- 00009: correct plan pricing (one-time setup + monthly fee) and record how/what each customer paid.
create or replace function public.plan_monthly_price_egp(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 49 when 'business' then 79 when 'dynamic' then 149 end;
$$;
create or replace function public.plan_setup_price_egp(p public.site_plan)
returns int language sql immutable set search_path = public as $$
  select case p when 'menu' then 499 when 'business' then 999 when 'dynamic' then 1999 end;
$$;

alter table public.submissions add column if not exists payment_method text;
alter table public.submissions add column if not exists payment_amount_egp int;
alter table public.submissions add column if not exists payment_reference text;
alter table public.submissions drop constraint if exists submissions_payment_method_check;
alter table public.submissions add constraint submissions_payment_method_check
  check (payment_method is null or payment_method in ('instapay','vodafone_cash','orange_cash','etisalat_cash','we_pay','bank_transfer'));
alter table public.submissions drop constraint if exists submissions_payment_amount_check;
alter table public.submissions add constraint submissions_payment_amount_check
  check (payment_amount_egp is null or payment_amount_egp between 0 and 100000);
alter table public.submissions drop constraint if exists submissions_payment_reference_check;
alter table public.submissions add constraint submissions_payment_reference_check
  check (payment_reference is null or char_length(payment_reference) <= 60);

insert into public.settings (key, value, description, is_public)
values ('payment_accounts', '{}'::jsonb, 'Where customers send money, per payment method (wallet numbers, InstaPay, bank)', true)
on conflict (key) do nothing;

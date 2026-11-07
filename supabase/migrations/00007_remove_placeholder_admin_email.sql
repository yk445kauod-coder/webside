-- 00001 seeded a placeholder admin (admin@webside.dev, a domain we do not own).
-- Remove it wherever it is still present; real admins are managed in /sudo/settings.
update public.settings
set value = coalesce(
  (select jsonb_agg(e) from jsonb_array_elements(value) e where e <> '"admin@webside.dev"'::jsonb),
  '[]'::jsonb)
where key = 'sudo_admin_emails'
  and value @> '"admin@webside.dev"'::jsonb;

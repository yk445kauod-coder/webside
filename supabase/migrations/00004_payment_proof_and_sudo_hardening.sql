-- 00004: payment proof (InstaPay screenshot) + stricter SUDO check.
-- Additive only: no existing column, policy or bucket is dropped or changed.
--
-- Rollback (manual):
--   alter table public.submissions drop column payment_proof_path;
--   drop function public.sudo_clear_payment_proof(uuid);
--   drop policy payment_proofs_insert_own on storage.objects;
--   drop policy payment_proofs_select on storage.objects;
--   drop policy payment_proofs_delete_sudo on storage.objects;
--   delete from storage.buckets where id = 'payment-proofs';
--   -- is_sudo(): restore the previous body (exact-case email match, no confirmation check).

-- 1. Where the customer's transfer screenshot lives (path inside the private bucket).
alter table public.submissions add column if not exists payment_proof_path text;
alter table public.submissions drop constraint if exists submissions_payment_proof_path_check;
alter table public.submissions add constraint submissions_payment_proof_path_check
  check (payment_proof_path is null or payment_proof_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]{1,80}$');

-- 2. Private bucket with hard caps so it can never eat the free-tier storage:
--    300 KB per file, images only. The app also compresses to WebP before upload.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 307200, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Customers can upload only inside their own folder (<user id>/…) and read only their own files.
create policy payment_proofs_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy payment_proofs_select on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_sudo()));

-- Only SUDO deletes proofs (after verifying the payment).
create policy payment_proofs_delete_sudo on storage.objects
  for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_sudo());

-- 3. Clear the reference once SUDO has deleted the file. Audited.
create or replace function public.sudo_clear_payment_proof(p_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_sudo() then
    raise exception 'Not authorized';
  end if;
  update public.submissions set payment_proof_path = null where id = p_submission_id;
  insert into public.audit_logs (actor_id, actor_role, action, entity, entity_id, metadata)
  values ((select auth.uid()), 'sudo', 'payment_proof.deleted', 'submission', p_submission_id::text, '{}'::jsonb);
end;
$$;
revoke execute on function public.sudo_clear_payment_proof(uuid) from public, anon;
grant execute on function public.sudo_clear_payment_proof(uuid) to authenticated, service_role;

-- 4. InstaPay link, editable by SUDO and readable by customers (is_public).
insert into public.settings (key, value, description, is_public)
values ('instapay_link', '""'::jsonb, 'InstaPay payment link/handle shown to customers when publishing', true)
on conflict (key) do nothing;

-- 5. SUDO check: case-insensitive and only for confirmed email addresses.
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
    join auth.users u on u.id = auth.uid()
    where s.key = 'sudo_admin_emails'
      and u.email_confirmed_at is not null
      and lower(u.email) in (
        select lower(e) from jsonb_array_elements_text(coalesce(s.value, '[]'::jsonb)) as e
      )
  );
$$;

-- 00006: trigger functions are never called by clients; remove API execute rights.
-- Already applied to production.
revoke execute on function public.sites_guard_plan() from public, anon, authenticated;
revoke execute on function public.pages_enforce_plan() from public, anon, authenticated;
